import { LoggerService as NestLoggerService } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  APP_RUNTIME_CONFIG_TOKEN,
  PERSISTENCE_RUNTIME_CONFIG_TOKEN,
  type AppRuntimeConfig,
  type PersistenceRuntimeConfig,
} from '@repo/config';
import { LOGGER_TOKEN, LoggerPort } from '@repo/ports';
import { WorkersModule } from './workers.module';

export async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkersModule, {
    bufferLogs: true,
  });

  try {
    const logger = app.get<NestLoggerService>(LOGGER_TOKEN);
    app.useLogger(logger);
  } catch (error) {
    void error;
  }

  app.enableShutdownHooks();

  const logger = app.get<LoggerPort>(LOGGER_TOKEN);
  const appConfig = app.get<AppRuntimeConfig>(APP_RUNTIME_CONFIG_TOKEN);
  const persistenceConfig = app.get<PersistenceRuntimeConfig>(PERSISTENCE_RUNTIME_CONFIG_TOKEN);

  logger.log(
    `Workers runtime started [pid=${process.pid}, env=${appConfig.nodeEnv}, events=${persistenceConfig.eventsStoreDriver}]`,
    'WorkersBootstrap',
  );
}

if (require.main === module) {
  void bootstrap();
}
