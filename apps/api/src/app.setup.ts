import { RequestMethod, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  HTTP_RUNTIME_CONFIG_TOKEN,
  type HttpRuntimeConfig,
} from '@workspace/ports/config';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { LOGGER_TOKEN, LoggerPort } from '@workspace/ports';
import { configureCors } from './setups/cors.setup';
import { configureSwagger } from './setups/swagger.setup';

export function configureHttpApp(app: NestExpressApplication): void {
  try {
    const logger = app.get<LoggerPort>(LOGGER_TOKEN);
    app.useLogger(logger);
  } catch (error) {
    console.error(error);
  }

  app.enableShutdownHooks();
  // robots.txt must be reachable at the bare domain root, not /api/robots.txt.
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'robots.txt', method: RequestMethod.GET }],
  });
  app.use(cookieParser());
  app.use(compression());

  configureCors(app);

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
  // `useBodyParser` (not `app.use(json(...))`) — see main.ts's doc comment:
  // this is what actually lets Nest capture `req.rawBody` for webhook
  // signature verification. Global, not route-scoped — every request gets
  // `rawBody` populated uniformly.
  app.useBodyParser('json', { limit: httpConfig.jsonBodyLimit });
  app.useBodyParser('urlencoded', { extended: true, limit: httpConfig.jsonBodyLimit });

  configureSwagger(app);
}
