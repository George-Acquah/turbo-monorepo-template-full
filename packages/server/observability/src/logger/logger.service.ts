/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, LoggerService as INestLoggerService, Inject } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';
import LokiTransport from 'winston-loki';
import { Counter } from 'prom-client';
import {
  CONTEXT_TOKEN,
  ContextPort,
  LoggerPort,
  PROMETHEUS_PORT_TOKEN,
  PrometheusPort,
} from '@repo/ports';
import { type ConfigType } from '@nestjs/config';
import { GrafanaConfig } from '../config/grafana.config';

type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

const toLogLevel = (v: unknown, fallback: LogLevel = 'info'): LogLevel => {
  const s = typeof v === 'string' ? v.toLowerCase() : '';
  const allowed: LogLevel[] = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
  return (allowed as string[]).includes(s) ? (s as LogLevel) : fallback;
};

/**
 * Safe stringify that won't crash on circular objects (e.g. some Error objects)
 */
const safeJsonStringify = (value: unknown): string => {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === 'object') {
      if (seen.has(v as object)) return '[Circular]';
      seen.add(v as object);
    }
    if (v instanceof Error) {
      return {
        name: v.name,
        message: v.message,
        stack: v.stack,
      };
    }
    return v;
  });
};

@Injectable()
export class LoggerService implements INestLoggerService, LoggerPort {
  private readonly logger: Logger;
  private readonly logLevelCount: Counter<string>;
  private readonly grafana: ConfigType<typeof GrafanaConfig>;
  private readonly lokiTransport?: LokiTransport;

  constructor(
    @Inject(PROMETHEUS_PORT_TOKEN) private readonly prometheusService: PrometheusPort,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
    @Inject(GrafanaConfig.KEY) grafana: ConfigType<typeof GrafanaConfig>,
  ) {
    this.grafana = grafana;

    const appName = this.grafana.appName ?? 'TEMPLATE';
    const env = this.grafana.env ?? 'development';

    // Console transport (pretty)
    const transportList: any[] = [
      new transports.Console({
        format: format.combine(format.timestamp(), LoggerService.consoleFormat(appName)),
      }),
      // Optional: capture transport errors (helps debugging)
      // new transports.Console({ level: 'error' }),
    ];

    // Loki enablement
    const isGrafanaCloud = !!(grafana?.lokiUrl && grafana.lokiUser && grafana?.lokiPassword);
    const lokiEnabled = grafana?.enableLoki || isGrafanaCloud;

    if (lokiEnabled) {
      const baseLabels = {
        app: appName,
        environment: env,
      };

      const lokiOptions: any = isGrafanaCloud
        ? {
            host: grafana.lokiUrl,
            basicAuth: `${grafana.lokiUser}:${grafana.lokiPassword}`,
            labels: { job: 'template-api-logs', ...baseLabels },
            batching: true,
            batchInterval: 5000,
          }
        : {
            host: grafana.localLokiHost, // IMPORTANT: set to http://template-loki:3100 in docker
            labels: { job: 'template-logs-local', ...baseLabels },
            batching: true, // batching ON is safer; avoids lots of tiny pushes
            batchInterval: 1000,
          };

      console.log(
        isGrafanaCloud
          ? `Grafana Cloud Loki enabled → ${grafana.lokiUrl}`
          : `ℹ Local Loki enabled → ${grafana.localLokiHost}`,
      );

      /**
       * Critical: do NOT set json:true + format.json() while also sending object logs.
       * We send a single JSON string line ourselves (see write()).
       */
      const lokiTransport = new LokiTransport({
        ...lokiOptions,

        // Promote these fields (if present on the log info object) to Loki labels
        // Note: since we log string lines, labels will mainly come from `labels` above,
        // but level will still be available as a Loki label via Winston info.level.
        labelKeys: ['level', 'context', 'app', 'environment'],

        replaceTimestamp: true,

        handleExceptions: true,
        handleRejections: true,
      });

      lokiTransport.on('error', (err) => {
        console.log('Loki transport error event:', err);
      });

      this.lokiTransport = lokiTransport;
      transportList.push(lokiTransport);
    }

    const level = toLogLevel(grafana.logLevel, 'info');

    this.logger = createLogger({
      level,
      transports: transportList,

      /**
       * Default meta becomes part of the Winston "info" object.
       * We also include these in our JSON payload so they appear in the log line.
       */
      defaultMeta: {
        service: 'Template API',
        app: appName,
        environment: env,
        version: this.grafana.appVersion ?? 'unknown',
        instance: this.grafana.instance ?? 'local',
      },
    });

    this.logLevelCount = new Counter({
      name: 'log_level_count',
      help: 'Count of logs by severity level',
      labelNames: ['level'],
    });

    this.prometheusService.registerMetric(this.logLevelCount);
  }

  /**
   * Build structured JSON payload (this becomes the log LINE stored in Loki)
   */
  private buildPayload(message: string, context?: string, trace?: unknown) {
    const requestId = this.context.getRequestId();
    const userId = this.context.getUserIdOptional();
    const method = this.context.getMethod();
    const path = this.context.getRoutePath();
    const ip = this.context.getIp();

    return {
      timestamp: new Date().toISOString(),
      message,
      context,
      trace,
      requestId,
      userId,
      method,
      path,
      ip,

      service: 'Template API',
      app: this.grafana.appName ?? 'TEMPLATE',
      environment: this.grafana.env ?? 'development',
      version: this.grafana.appVersion ?? 'unknown',
      instance: this.grafana.instance ?? 'local',
      pid: process.pid,
    };
  }

  /**
   * One place to write logs:
   * - console transport still renders pretty because it parses info.message (stringified JSON)
   * - loki transport receives a single string line (valid JSON), no malformed push payloads
   */
  private write(level: LogLevel, payload: Record<string, unknown>) {
    // Ensure message is a string (fixes Loki push parse errors)
    const line = safeJsonStringify(payload);

    // Put context on info object so labelKeys can pick it up as a label if desired
    const ctx =
      typeof payload.context === 'string' && payload.context.length > 0
        ? payload.context
        : undefined;

    this.logger.log(level, line, ctx ? { context: ctx } : undefined);
    this.record(level);
  }

  log(message: string, context?: string) {
    this.write('info', this.buildPayload(message, context));
  }

  error(message: string, trace?: unknown, context?: string) {
    this.write('error', this.buildPayload(message, context, trace));
  }

  warn(message: string, context?: string) {
    this.write('warn', this.buildPayload(message, context));
  }

  debug(message: string, context?: string) {
    this.write('debug', this.buildPayload(message, context));
  }

  verbose(message: string, context?: string) {
    this.write('verbose', this.buildPayload(message, context));
  }

  private record(level: string) {
    this.logLevelCount.inc({ level });
  }

  /**
   * Optional: call this on shutdown to flush buffered logs
   * (useful if batching is enabled)
   */
  async flush(): Promise<void> {
    const t: any = this.lokiTransport as any;
    if (t?.flush) {
      await new Promise<void>((resolve) => t.flush(() => resolve()));
    }
  }

  /**
   * Pretty console formatting (NOT sent to Loki)
   */
  static consoleFormat(appName: string): ReturnType<(typeof format)['printf']> {
    const color = {
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      debug: '\x1b[34m',
      verbose: '\x1b[36m',
      reset: '\x1b[0m',
      dim: '\x1b[2m',
    };

    return format.printf((info) => {
      const level = typeof info.level === 'string' ? info.level : 'info';
      const c = (color as any)[level] || color.reset;
      const dim = color.dim;

      // We log JSON strings; parse for nicer console output.
      let payload: any = undefined;
      if (typeof info.message === 'string') {
        try {
          payload = JSON.parse(info.message);
        } catch {
          payload = undefined;
        }
      }

      const msg =
        payload && typeof payload.message === 'string'
          ? payload.message
          : typeof info.message === 'string'
            ? info.message
            : safeJsonStringify(info.message);

      const ctx =
        payload && typeof payload.context === 'string'
          ? payload.context
          : (info as any).context || 'App';

      const trace =
        payload && typeof payload.trace === 'string'
          ? payload.trace
          : (info as any).stack || (info as any).trace;

      return `${c}[${appName}]${color.reset} ${color.dim}${process.pid}${color.reset} - ${
        info.timestamp
      } ${c}[${ctx}]${color.reset} ${msg}${trace ? `\n${dim}${trace}${color.reset}` : ''}`;
    });
  }
}
