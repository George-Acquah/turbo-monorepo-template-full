export interface MetricsTimer {
  end(tags?: Record<string, string>): void;
}

export abstract class MetricsPort {
  abstract increment(name: string, tags?: Record<string, string>): void;
  abstract startTimer(name: string, tags?: Record<string, string>): MetricsTimer;
  abstract time<T>(
    name: string,
    tags: Record<string, string> | undefined,
    fn: () => Promise<T>,
  ): Promise<T>;
}

export const METRICS_PORT_TOKEN = Symbol('METRICS_PORT_TOKEN');

export abstract class PrometheusPort {
  abstract recordRequest(
    method: string,
    route: string,
    status: string,
    duration: number,
    requestSize?: number,
    responseSize?: number,
  ): void;

  abstract recordDatabaseQuery(operation: string, table: string, duration: number): void;

  abstract registerMetric(metric: unknown): void;

  abstract getMetrics(): Promise<string>;

  abstract getCounterValue(name: string): number | undefined;
}
export const PROMETHEUS_PORT_TOKEN = Symbol('PROMETHEUS_PORT_TOKEN');
