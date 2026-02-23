import { PrometheusPort } from '@repo/ports';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'prom-client';
import { grafanaConfigKey, IGrafanaConfig } from './config/grafana.conig';

@Injectable()
export class PrometheusService implements PrometheusPort, OnModuleInit, OnModuleDestroy {
  private readonly register: client.Registry;
  private readonly httpRequestCount: client.Counter<string>;
  private readonly httpRequestDuration: client.Histogram<string>;
  private readonly httpRequestSize: client.Histogram<string>;
  private readonly httpResponseSize: client.Histogram<string>;
  private readonly errorCount: client.Counter<string>;
  private readonly dbQueryDuration: client.Histogram<string>;

  // Grafana Cloud - NOT used when Grafana Agent is scraping
  private readonly grafanaCloudEnabled: boolean;

  constructor(private readonly config: ConfigService) {
    const grafana = this.config.get<IGrafanaConfig>(grafanaConfigKey);
    this.register = new client.Registry();

    // Set default labels that will appear on ALL metrics
    this.register.setDefaultLabels({
      app: grafana?.appName || 'repo',
      environment: grafana?.env || 'development',
      instance: grafana?.instance || 'local',
      version: grafana?.appVersion || 'unknown',
    });

    // Collect default Node.js metrics
    client.collectDefaultMetrics({
      register: this.register,
      prefix: 'repo_',
    });

    // HTTP request counter
    this.httpRequestCount = new client.Counter({
      name: 'repo_http_requests_total',
      help: 'Total count of HTTP requests received',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    // HTTP request duration histogram
    this.httpRequestDuration = new client.Histogram({
      name: 'repo_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    // Request size histogram
    this.httpRequestSize = new client.Histogram({
      name: 'repo_http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.register],
    });

    // Response size histogram
    this.httpResponseSize = new client.Histogram({
      name: 'repo_http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.register],
    });

    // Error counter
    this.errorCount = new client.Counter({
      name: 'repo_http_errors_total',
      help: 'Total count of HTTP errors',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    // Database query duration histogram
    this.dbQueryDuration = new client.Histogram({
      name: 'repo_db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 5],
      registers: [this.register],
    });

    // Check if Grafana Cloud direct push is enabled
    // NOTE: This is NOT recommended - use Grafana Agent instead
    const prometheusUrl = grafana?.prometheusUrl;
    const prometheusUser = grafana?.prometheusUser;
    const prometheusPassword = grafana?.prometheusPassword;

    if (prometheusUrl && prometheusUser && prometheusPassword) {
      this.grafanaCloudEnabled = true;
      console.log('Direct Grafana Cloud push enabled - Consider using Grafana Agent instead');
      console.log('   Grafana Agent provides better reliability and performance');
    } else {
      this.grafanaCloudEnabled = false;
      console.log(
        'ℹMetrics exposed at /api/metrics - Use Grafana Agent or Prometheus to scrape',
      );
    }
  }

  onModuleInit() {
    // No need to push if using Grafana Agent
    if (!this.grafanaCloudEnabled) {
      console.log('Prometheus metrics ready - waiting for scraper');
      console.log('Metrics endpoint: /api/metrics');
      console.log('Configure Grafana Agent to scrape this endpoint');
    }
  }

  onModuleDestroy() {
    // Cleanup if needed
    console.log('Prometheus service shutting down');
  }

  // Record HTTP request metrics
  recordRequest(
    method: string,
    route: string,
    status: string,
    duration: number,
    requestSize?: number,
    responseSize?: number,
  ): void {
    const statusCode = parseInt(status);

    this.httpRequestCount.inc({ method, route, status_code: status });
    this.httpRequestDuration.observe({ method, route, status_code: status }, duration);

    if (requestSize) {
      this.httpRequestSize.observe({ method, route }, requestSize);
    }

    if (responseSize) {
      this.httpResponseSize.observe({ method, route, status_code: status }, responseSize);
    }

    // Record errors (5xx status codes)
    if (statusCode >= 500) {
      this.errorCount.inc({ method, route, status_code: status });
    }
  }

  // Record database query metrics
  recordDatabaseQuery(operation: string, table: string, duration: number): void {
    this.dbQueryDuration.observe({ operation, table }, duration);
  }

  // Register additional custom metrics
  registerMetric(metric: client.Metric<string>): void {
    this.register.registerMetric(metric);
  }

  // Get all metrics in Prometheus text format
  // This is what Grafana Agent will scrape
  getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Get counter metric value (for testing/debugging)
  getCounterValue(name: string): number | undefined {
    const metric = (
      this.register as unknown as { getSingleMetricAsArray(name: string): unknown[] }
    ).getSingleMetricAsArray(name)?.[0] as Record<string, unknown> | undefined;
    return (metric?.values as Record<string, unknown>[] | undefined)?.[0]?.value as
      | number
      | undefined;
  }
}
