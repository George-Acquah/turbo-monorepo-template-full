import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { PROMETHEUS_PORT_TOKEN, PrometheusPort } from '@repo/ports';
import type { AppRequest, NextFunction, Response } from '@repo/types';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(@Inject(PROMETHEUS_PORT_TOKEN) private readonly prometheusService: PrometheusPort) {}

  use(req: AppRequest, res: Response, next: NextFunction) {
    const start = Date.now();
    const requestSize = parseInt(req.get('content-length') || '0', 10);

    const onFinish = () => {
      try {
        const duration = (Date.now() - start) / 1000;
        const responseSize = parseInt(res.getHeader('content-length') as string, 10) || 0;

        // Extract route path for better metrics grouping
        const route = req.route?.path || req.path || 'unknown';

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
        if (process.env.DEBUG_METRICS === 'true') {
          console.error('Error recording metrics:', error);
        }
      }
    };

    res.on('finish', onFinish);
    // res.on('close', onFinish);

    next();
  }
}
