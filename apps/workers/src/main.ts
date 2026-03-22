import { LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { LOGGER_TOKEN, LoggerPort } from '@repo/ports';
import { resolveStoreDrivers } from '@repo/persistence';
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
  const config = app.get<ConfigService>(ConfigService);
  const drivers = resolveStoreDrivers();

  logger.log(
    `Workers runtime started [pid=${process.pid}, env=${config.get<string>('NODE_ENV') ?? 'development'}, events=${drivers.eventsStoreDriver}]`,
    'WorkersBootstrap',
  );
}

if (require.main === module) {
  void bootstrap();
}
