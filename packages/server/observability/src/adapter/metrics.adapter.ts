import { Inject, Injectable } from '@nestjs/common';
import { Histogram, Counter } from 'prom-client';
import { MetricsPort, MetricsTimer, PROMETHEUS_PORT_TOKEN, PrometheusPort } from '@repo/ports';

@Injectable()
export class PrometheusMetricsAdapter implements MetricsPort {
  private readonly counters = new Map<string, Counter<string>>();
  private readonly histograms = new Map<string, Histogram<string>>();

  constructor(@Inject(PROMETHEUS_PORT_TOKEN) private readonly prometheus: PrometheusPort) {}

  increment(name: string, tags?: Record<string, string>): void {
    const metricName = this.normalizeMetricName(name);

    let counter = this.counters.get(metricName);

    if (!counter) {
      counter = new Counter({
        name: metricName,
        help: metricName,
        labelNames: Object.keys(tags ?? {}),
      });

      this.prometheus.registerMetric(counter);
      this.counters.set(metricName, counter);
    }

    counter.inc(tags || {});
  }

  startTimer(name: string, tags?: Record<string, string>): MetricsTimer {
    const metricName = this.normalizeTimerName(name);
    const histogram = this.getHistogram(metricName, tags);
    const end = histogram.startTimer(tags);

    return {
      end: (extraTags?: Record<string, string>) => {
        end(extraTags);
      },
    };
  }

  async time<T>(
    name: string,
    tags: Record<string, string> | undefined,
    fn: () => Promise<T>,
  ): Promise<T> {
    const timer = this.startTimer(name, tags);

    try {
      return await fn();
    } finally {
      timer.end();
    }
  }

  private getHistogram(name: string, tags?: Record<string, string>) {
    let histogram = this.histograms.get(name);

    if (!histogram) {
      histogram = new Histogram({
        name,
        help: name,
        labelNames: Object.keys(tags ?? {}),
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
      });

      this.prometheus.registerMetric(histogram);
      this.histograms.set(name, histogram);
    }

    return histogram;
  }

  /**
   * Prometheus-compliant metric name normalization
   * Allowed: [a-zA-Z0-9_:]
   */
  private normalizeMetricName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9_:]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }

  /**
   * All timers must end with `_seconds` (Prometheus best practice)
   */
  private normalizeTimerName(name: string): string {
    const normalized = this.normalizeMetricName(name);
    return normalized.endsWith('_seconds') ? normalized : `${normalized}_seconds`;
  }
}
