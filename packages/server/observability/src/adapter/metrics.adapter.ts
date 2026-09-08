import { Inject, Injectable, Logger } from '@nestjs/common';
import { Histogram, Counter, Gauge } from 'prom-client';
import {
  MetricsPort,
  MetricsTimer,
  PROMETHEUS_PORT_TOKEN,
  PrometheusPort,
} from '@workspace/ports';

@Injectable()
export class PrometheusMetricsAdapter implements MetricsPort {
  private readonly logger = new Logger(PrometheusMetricsAdapter.name);
  private readonly counters = new Map<string, Counter<string>>();
  private readonly histograms = new Map<string, Histogram<string>>();
  private readonly gauges = new Map<string, Gauge<string>>();
  /** Label names each metric was REGISTERED with, so later calls can be projected onto them. */
  private readonly registeredLabels = new Map<string, string[]>();
  /** Names already warned about, so a per-request mismatch can't itself become a log flood. */
  private readonly warnedMismatches = new Set<string>();

  constructor(@Inject(PROMETHEUS_PORT_TOKEN) private readonly prometheus: PrometheusPort) {}

  increment(name: string, tags?: Record<string, string>, amount = 1): void {
    const metricName = this.normalizeMetricName(name);

    let counter = this.counters.get(metricName);

    if (!counter) {
      const labelNames = Object.keys(tags ?? {});
      counter = new Counter({ name: metricName, help: metricName, labelNames });

      this.prometheus.registerMetric(counter);
      this.counters.set(metricName, counter);
      this.registeredLabels.set(metricName, labelNames);
    }

    counter.inc(this.projectLabels(metricName, tags), amount);
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    const metricName = this.normalizeMetricName(name);

    let gauge = this.gauges.get(metricName);

    if (!gauge) {
      const labelNames = Object.keys(tags ?? {});
      gauge = new Gauge({ name: metricName, help: metricName, labelNames });

      this.prometheus.registerMetric(gauge);
      this.gauges.set(metricName, gauge);
      this.registeredLabels.set(metricName, labelNames);
    }

    gauge.set(this.projectLabels(metricName, tags), value);
  }

  /**
   * Reconcile a call's tags with the label set the metric was registered with.
   *
   * prom-client fixes `labelNames` at construction, and this adapter memoises
   * by metric NAME only — so the first call to a given name decides its labels
   * forever. A later call passing a different tag set would otherwise throw
   * ("Added label X is not included in initial labelset") or silently record
   * against the wrong series. Rather than crash a request over a metric, drop
   * unknown labels, fill missing ones, and warn once per metric name.
   */
  private projectLabels(
    metricName: string,
    tags?: Record<string, string>,
  ): Record<string, string> {
    const registered = this.registeredLabels.get(metricName) ?? [];
    const provided = tags ?? {};

    if (registered.length === 0) return {};

    const projected: Record<string, string> = {};
    for (const label of registered) {
      projected[label] = provided[label] ?? '';
    }

    const unknown = Object.keys(provided).filter((k) => !registered.includes(k));
    const missing = registered.filter((k) => provided[k] === undefined);

    if ((unknown.length > 0 || missing.length > 0) && !this.warnedMismatches.has(metricName)) {
      this.warnedMismatches.add(metricName);
      this.logger.warn(
        `Metric "${metricName}" was registered with labels [${registered.join(', ')}] ` +
          `but called with [${Object.keys(provided).join(', ')}]. ` +
          `Unknown labels dropped: [${unknown.join(', ')}]; missing filled with "": ` +
          `[${missing.join(', ')}]. Align the call sites — labels are fixed at first use.`,
      );
    }

    return projected;
  }

  startTimer(name: string, tags?: Record<string, string>): MetricsTimer {
    const metricName = this.normalizeTimerName(name);
    const histogram = this.getHistogram(metricName, tags);
    const end = histogram.startTimer(this.projectLabels(metricName, tags));

    return {
      end: (extraTags?: Record<string, string>) => {
        // Merge rather than replace: startTimer's labels are already bound, and
        // callers use end() to add outcome labels known only after the fact.
        end(extraTags ? this.projectLabels(metricName, { ...tags, ...extraTags }) : undefined);
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
      const labelNames = Object.keys(tags ?? {});
      histogram = new Histogram({
        name,
        help: name,
        labelNames,
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
      });

      this.prometheus.registerMetric(histogram);
      this.histograms.set(name, histogram);
      this.registeredLabels.set(name, labelNames);
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
