import { DynamicModule, Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';

import { REDIS_BULLMQ_CLIENT } from '@repo/constants';
import type { RedisClient } from '@repo/redis';

import { QUEUE_CONFIGS_TOKEN, type QueueConfig } from './interfaces/queue.interface';

import { BullQueueBus, BullQueueRegistry } from './transport/bull';
import { QUEUE_REGISTRY_TOKEN, QUEUE_BUS_TOKEN, QUEUE_SCHEDULER_TOKEN } from '@repo/ports';
import { QueueSchedulerService } from './scheduler';

@Global()
@Module({})
export class QueueModule {
  /**
   * Configure BullMQ once, using the injected Redis connection token.
   */
  static forRoot(): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        ConfigModule,
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [REDIS_BULLMQ_CLIENT],
          useFactory: async (redis: RedisClient) => ({
            connection: redis,
          }),
        }),
      ],
      providers: [
        // Defaults: no static queues unless registerQueues() is called.
        { provide: QUEUE_CONFIGS_TOKEN, useValue: [] as QueueConfig[] },

        BullQueueRegistry,
        BullQueueBus,
        QueueSchedulerService,
        { provide: QUEUE_SCHEDULER_TOKEN, useExisting: QueueSchedulerService },

        { provide: QUEUE_REGISTRY_TOKEN, useExisting: BullQueueRegistry },
        { provide: QUEUE_BUS_TOKEN, useExisting: BullQueueBus },
      ],
      exports: [
        BullModule,
        QueueSchedulerService,
        QUEUE_BUS_TOKEN,
        QUEUE_REGISTRY_TOKEN,
        QUEUE_CONFIGS_TOKEN,
      ],
    };
  }

  /**
   * Register static queues for DI (InjectQueue) AND for config sharing (registry/bus).
   * You can call this from feature packages.
   */
  static registerQueues(configs: QueueConfig[]): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        ...(configs.length > 0
          ? [
              BullModule.registerQueue(
                ...configs.map((config) => ({
                  name: config.name,
                  ...(config.defaultJobOptions && { defaultJobOptions: config.defaultJobOptions }),
                  ...(config.limiter && { limiter: config.limiter }),
                })),
              ),
            ]
          : []),
      ],
      providers: [{ provide: QUEUE_CONFIGS_TOKEN, useValue: configs }],
      exports: [BullModule, QUEUE_CONFIGS_TOKEN],
    };
  }
}
