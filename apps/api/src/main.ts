import { NestFactory } from '@nestjs/core';
import { HTTP_RUNTIME_CONFIG_TOKEN, type HttpRuntimeConfig } from '@repo/config';
import { AppModule } from './app.module';
import { configureHttpApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  configureHttpApp(app);
  const httpConfig = app.get<HttpRuntimeConfig>(HTTP_RUNTIME_CONFIG_TOKEN);

  await app.listen(httpConfig.port);
}

void bootstrap();
