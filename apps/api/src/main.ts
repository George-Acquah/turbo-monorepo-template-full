import {
  ValidationPipe,
  LoggerService as LoggerServiceType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
// import { LoggerService } from '@repo/observability';
import { LOGGER_TOKEN } from '@repo/ports';

async function bootstrap() {
  // const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  try {
    const logger = app.get<LoggerServiceType>(LOGGER_TOKEN);
    app.useLogger(logger);
  } catch (e) {
    // no custom logger registered — fall back to default Nest logger
    void e;
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

  const rawPort = config.get<string>('PORT') ?? '3000';
  const port = Number(rawPort);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  await app.listen(port);
}

void bootstrap();
