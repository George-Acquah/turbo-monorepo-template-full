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
import { ConfigService } from '@nestjs/config';
import { IGrafanaConfig, grafanaConfigKey } from '../config/grafana.conig';

@Injectable()
export class LoggerService implements INestLoggerService, LoggerPort {
  private readonly logger: Logger;
  private readonly logLevelCount: Counter<string>;
  private readonly grafana?: IGrafanaConfig;

  constructor(
    @Inject(PROMETHEUS_PORT_TOKEN) private readonly prometheusService: PrometheusPort,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
    private readonly config: ConfigService,
  ) {
    // Extract the namespaced config
    this.grafana = this.config.get<IGrafanaConfig>(grafanaConfigKey);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transportList: any[] = [
      new transports.Console({
        format: format.combine(format.timestamp(), LoggerService.consoleFormat()),
      }),
    ];

    const isGrafanaCloud = !!(
      this.grafana?.lokiUrl &&
      this.grafana.lokiUser &&
      this.grafana?.lokiPassword
    );
    const lokiEnabled = this.grafana?.enableLoki || isGrafanaCloud;

    if (lokiEnabled) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let lokiOptions: any;

      if (isGrafanaCloud) {
        console.log(`Grafana Cloud (UK Region) Loki enabled → ${this.grafana.lokiUrl}`);
        lokiOptions = {
          host: this.grafana.lokiUrl,
          basicAuth: `${this.grafana.lokiUser}:${this.grafana.lokiPassword}`,
          labels: {
            job: 'repo-logs',
            app: this.grafana.appName,
            environment: this.grafana.env || 'production',
          },
          batching: true,
          batchInterval: 5000,
        };
      } else {
        console.log(`ℹLocal Loki enabled → ${this.grafana.localLokiHost}`);
        lokiOptions = {
          host: this.grafana.localLokiHost,
          labels: {
            job: 'repo-logs-local',
            app: this.grafana.appName,
            environment: 'development',
          },
          batching: false,
        };
      }

      transportList.push(
        new LokiTransport({
          ...lokiOptions,
          json: true,
          handleExceptions: true,
          handleRejections: true,
          onConnectionError: (_err) => {
            // Change warn to a simple console log to avoid recursive logging loops
            console.log('Loki waiting for connectivity...');
          },
          format: format.json(),
        }),
      );
    }

    const level = this.config.get<string>('LOG_LEVEL');

    this.logger = createLogger({
      level,
      transports: transportList,
    });

    this.logLevelCount = new Counter({
      name: 'log_level_count',

      help: 'Count of logs by severity level',

      labelNames: ['level'],
    });

    this.prometheusService.registerMetric(this.logLevelCount);
  }
  /**
   * Build structured JSON log payload
   */
  private buildPayload(message: string, context?: string, trace?: string) {
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

      // 🌍 Request metadata
      requestId,
      userId,

      // HTTP specific metadata
      method,
      path,
      ip,

      service: 'Template API',
      environment: this.grafana?.env || 'development',
      version: this.grafana?.appVersion || 'unknown',
      instance: this.grafana?.instance || 'local',
      pid: process.pid,
    };
  }

  log(message: string, context?: string) {
    const payload = this.buildPayload(message, context);
    this.logger.info(payload);
    this.record('info');
  }

  error(message: string, trace?: string, context?: string) {
    const payload = this.buildPayload(message, context, trace);
    this.logger.error(payload);
    this.record('error');
  }

  warn(message: string, context?: string) {
    const payload = this.buildPayload(message, context);
    this.logger.warn(payload);
    this.record('warn');
  }

  debug(message: string, context?: string) {
    const payload = this.buildPayload(message, context);
    this.logger.debug(payload);
    this.record('debug');
  }

  verbose(message: string, context?: string) {
    const payload = this.buildPayload(message, context);
    this.logger.verbose(payload);
    this.record('verbose');
  }

  private record(level: string) {
    this.logLevelCount.inc({ level });
  }

  /**
   * Pretty console formatting (not sent to Loki)
   */
  static consoleFormat(): ReturnType<(typeof format)['printf']> {
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
      // Safely access color using type guard
      const level = typeof info.level === 'string' ? info.level : 'info';
      const c = color[level as keyof typeof color] || color.reset;
      const dim = color.dim;

      return `${c}[${this.prototype.grafana?.appName || 'Template'}]${color.reset} ${dim}${process.pid}${color.reset} - ${
        info.timestamp
      } ${c}[${(info.context as string) || 'App'}]${color.reset} ${info.message}${
        (info.trace as string) ? `\n${dim}${info.trace}${color.reset}` : ''
      }`;
    });
  }
}
