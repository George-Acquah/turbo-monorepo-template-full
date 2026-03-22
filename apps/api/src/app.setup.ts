import { INestApplication, LoggerService as LoggerServiceType, ValidationPipe } from '@nestjs/common';
import { HTTP_RUNTIME_CONFIG_TOKEN, type HttpRuntimeConfig } from '@repo/config';
import { json, urlencoded } from 'express';
import { LOGGER_TOKEN } from '@repo/ports';

export function configureHttpApp(app: INestApplication): void {
  try {
    const logger = app.get<LoggerServiceType>(LOGGER_TOKEN);
    app.useLogger(logger);
  } catch (error) {
    void error;
  }

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const httpConfig = app.get<HttpRuntimeConfig>(HTTP_RUNTIME_CONFIG_TOKEN);
  app.use(json({ limit: httpConfig.jsonBodyLimit }));
  app.use(urlencoded({ extended: true, limit: httpConfig.jsonBodyLimit }));
}
