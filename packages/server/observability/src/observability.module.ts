import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrometheusController } from './prometheus.controller';
import { LoggerService } from './logger/logger.service';
import { PrometheusMetricsAdapter } from './adapter/metrics.adapter';
import { PrometheusService } from './prometheus.service';
import { LOGGER_TOKEN, METRICS_PORT_TOKEN, PROMETHEUS_PORT_TOKEN } from '@repo/ports';
import { MetricsMiddleware } from './middlewares/metrics.middleware';

@Global()
@Module({
  controllers: [PrometheusController],
  providers: [
    PrometheusService,
    LoggerService,
    PrometheusMetricsAdapter,
    {
      provide: LOGGER_TOKEN,
      useExisting: LoggerService,
    },
    {
      provide: METRICS_PORT_TOKEN,
      useExisting: PrometheusMetricsAdapter,
    },
    {
      provide: PROMETHEUS_PORT_TOKEN,
      useExisting: PrometheusService,
    },
  ],
  exports: [LoggerService, METRICS_PORT_TOKEN, PROMETHEUS_PORT_TOKEN, LOGGER_TOKEN],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*path');
  }
}
