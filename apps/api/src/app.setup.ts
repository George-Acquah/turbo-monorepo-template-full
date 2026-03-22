import { INestApplication, LoggerService as LoggerServiceType, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

  const config = app.get<ConfigService>(ConfigService);
  const bodyLimit = config.get<string>('JSON_BODY_LIMIT') ?? '1mb';
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));
}
