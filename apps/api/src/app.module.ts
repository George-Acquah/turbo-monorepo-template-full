import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthCoreModule } from '@repo/core';
import { AppContextModule } from '@repo/context';
import { EventsModule } from '@repo/events';
import { HttpExceptionEnvelopeFilter } from '@repo/filters';
import { HttpResponseEnvelopeInterceptor } from '@repo/interceptor';
import { ObservabilityModule } from '@repo/observability';
import { PersistenceModule } from '@repo/persistence';
import { QueueModule } from '@repo/queue';
import { RedisModule } from '@repo/redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ALL_PRODUCER_QUEUE_CONFIGS } from './configs/queues.config';

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
    QueueModule.forRoot(),
    QueueModule.registerQueues(ALL_PRODUCER_QUEUE_CONFIGS),
    PersistenceModule.forRoot({
      auth: true,
      events: true,
      transactions: true,
    }),
    AuthCoreModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionEnvelopeFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpResponseEnvelopeInterceptor,
    },
  ],
})
export class AppModule {}
