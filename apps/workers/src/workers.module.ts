import { Module } from '@nestjs/common';
import { ServerConfigModule } from '@repo/config';
import { AppContextModule } from '@repo/context';
import { EventsWorkersModule } from '@repo/events';
import { ObservabilityModule } from '@repo/observability';
import { PersistenceModule } from '@repo/persistence';
import { QueueModule } from '@repo/queue';
import { RedisModule } from '@repo/redis';
import { ALL_WORKER_QUEUE_CONFIGS } from './configs/queues.config';

@Module({
  imports: [
    ServerConfigModule.forRoot({
      runtime: 'workers',
    }),
    AppContextModule,
    ObservabilityModule,
    RedisModule,
    QueueModule.forRoot(),
    QueueModule.registerQueues(ALL_WORKER_QUEUE_CONFIGS),
    PersistenceModule.forRoot({
      events: true,
      transactions: false,
    }),
    EventsWorkersModule,
  ],
})
export class WorkersModule {}
