export interface MetricsTimer {
  end(tags?: Record<string, string>): void;
}

export abstract class MetricsPort {
  /**
   * Increment a counter.
   *
   * `amount` exists so callers can record "how many" as the increment rather
   * than smuggling a count into a LABEL. Passing a row count as a tag (e.g.
   * `{ count: '37' }`) mints a new permanent Prometheus series per distinct
   * value and still only increments by 1 — unbounded cardinality and a wrong
   * number at the same time.
   */
  abstract increment(name: string, tags?: Record<string, string>, amount?: number): void;

  /**
   * Set a gauge to an absolute value. Use this for "how many right now"
   * (active connections, backlog depth) instead of deriving it from a pair of
   * counters labelled per-entity.
   */
  abstract gauge(name: string, value: number, tags?: Record<string, string>): void;

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
