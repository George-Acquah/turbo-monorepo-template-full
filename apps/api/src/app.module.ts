import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthCoreModule } from '@repo/core';
import { AppContextModule } from '@repo/context';
import { MongoModule } from '@repo/mongo';
import { ObservabilityModule } from '@repo/observability';
import { PrismaModule } from '@repo/prisma';
import { RedisModule } from '@repo/redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthStoreModule } from './modules/auth-store.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    AppContextModule,
    ObservabilityModule,
    RedisModule,
    PrismaModule,
    MongoModule,
    AuthStoreModule.register(),
    AuthCoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
