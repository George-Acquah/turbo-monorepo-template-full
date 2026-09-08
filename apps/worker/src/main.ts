import { LoggerService as NestLoggerService } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  APP_RUNTIME_CONFIG_TOKEN,
  HTTP_RUNTIME_CONFIG_TOKEN,
  PERSISTENCE_RUNTIME_CONFIG_TOKEN,
  type AppRuntimeConfig,
  type HttpRuntimeConfig,
  type PersistenceRuntimeConfig,
} from '@workspace/ports/config';
import { LOGGER_TOKEN, LoggerPort } from '@workspace/ports';
import { WorkersModule } from './workers.module';

export async function bootstrap() {
  const app = await NestFactory.create(WorkersModule, {
    bufferLogs: true,
  });

  try {
    const logger = app.get<NestLoggerService>(LOGGER_TOKEN);
    app.useLogger(logger);
  } catch (error) {
    void error;
  }

  // Installs Nest's SIGTERM/SIGINT handlers, which is what lets the platform's
  // stop signal reach onModuleDestroy — @nestjs/bullmq closes its Workers
  // there, and Worker.close() waits for the in-flight job rather than dropping
  // it. The outbox drain is bounded to ~10s for this reason; keep the
  // platform's SIGTERM->SIGKILL grace window comfortably above that.
  app.enableShutdownHooks();

  const logger = app.get<LoggerPort>(LOGGER_TOKEN);
  const appConfig = app.get<AppRuntimeConfig>(APP_RUNTIME_CONFIG_TOKEN);
  const persistenceConfig = app.get<PersistenceRuntimeConfig>(
    PERSISTENCE_RUNTIME_CONFIG_TOKEN,
  );
  const httpConfig = app.get<HttpRuntimeConfig>(HTTP_RUNTIME_CONFIG_TOKEN);

  const port = httpConfig.port;

  // This app is a worker, but it still serves HTTP — deliberately. The
  // listener exists for GET /health (a deep Postgres+Redis check the platform
  // probes to gate a deploy) and GET /metrics. What makes it a worker rather
  // than a web service is purely that its service has no public domain; both
  // endpoints are reachable only over the private network. Do not expose it:
  // /metrics is unauthenticated.
  await app.listen(port, '0.0.0.0');

  logger.log(
    `Workers runtime started [pid=${process.pid}, env=${appConfig.nodeEnv}, events=${persistenceConfig.eventsStoreDriver}, port=${port}]`,
    'WorkersBootstrap',
  );
}

if (require.main === module) {
  void bootstrap();
}
