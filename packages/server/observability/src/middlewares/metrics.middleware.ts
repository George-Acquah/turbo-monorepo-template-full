import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import {
  OBSERVABILITY_RUNTIME_CONFIG_TOKEN,
  type ObservabilityRuntimeConfig,
} from '@workspace/ports/config';
import { PROMETHEUS_PORT_TOKEN, PrometheusPort } from '@workspace/ports';
import type { AppRequest, NextFunction, Response } from '@workspace/types';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(
    @Inject(PROMETHEUS_PORT_TOKEN) private readonly prometheusService: PrometheusPort,
    @Inject(OBSERVABILITY_RUNTIME_CONFIG_TOKEN)
    private readonly config: ObservabilityRuntimeConfig,
  ) {}

  use(req: AppRequest, res: Response, next: NextFunction) {
    const start = Date.now();
    const requestSize = parseInt(req.get('content-length') || '0', 10);

    const onFinish = () => {
      try {
        const duration = (Date.now() - start) / 1000;
        const responseSize = parseInt(res.getHeader('content-length') as string, 10) || 0;

        // Extract route path for metrics grouping.
        //
        // Only ever use the matched ROUTE PATTERN (`/:id`), never the raw
        // request path. For an unmatched request (404) `req.route` is
        // undefined, and falling back to `req.path` would mint a new
        // permanent Prometheus series per distinct URL — `/wp-login.php`,
        // `/.env`, every scanner probe — across five metrics. prom-client
        // never evicts label combinations, so on a 1 GB container that is a
        // cheap remote OOM vector, not just untidy cardinality.
        const route = req.route?.path ?? 'unmatched';

        // Safely get statusCode - check if it exists and is a number
        let statusCode = 500;
        if (res.statusCode && typeof res.statusCode === 'number') {
          statusCode = res.statusCode;
        }

        this.prometheusService.recordRequest(
          req.method,
          route,
          statusCode.toString(),
          duration,
          requestSize,
          responseSize,
        );
      } catch (error) {
        // Silently catch errors to prevent middleware from breaking
        if (this.config.debugMetrics) {
          console.error('Error recording metrics:', error);
        }
      }
    };

    res.on('finish', onFinish);
    // res.on('close', onFinish);

    next();
  }
}
