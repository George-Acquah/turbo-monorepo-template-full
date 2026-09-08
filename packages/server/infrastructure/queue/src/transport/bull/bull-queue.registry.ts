import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';

import { REDIS_BULLMQ_CLIENT } from '@workspace/constants';

import { QueueRegistryPort } from '@workspace/ports';

import { QUEUE_CONFIGS_TOKEN, type QueueConfig } from '../../interfaces/queue.interface';

import type { RedisClient } from '@workspace/redis';

@Injectable()
export class BullQueueRegistry implements QueueRegistryPort, OnModuleDestroy {
  /**
   * Promise memoization prevents duplicate queue creation
   * under concurrent access.
   */
  private readonly queues = new Map<string, Promise<Queue>>();

  constructor(
    @Inject(REDIS_BULLMQ_CLIENT)
    private readonly redis: RedisClient,

    @Inject(QUEUE_CONFIGS_TOKEN)
    private readonly configs: QueueConfig[],
  ) {}

  async getOrCreateQueue(queueName: string): Promise<Queue> {
    return this.getOrCreate(queueName, () =>
      this.createQueue(queueName, this.findConfig(queueName)),
    );
  }

  async getOrCreatePartitionedQueue(baseQueueName: string, partitionKey: string): Promise<Queue> {
    const queueName = this.buildPartitionedQueueName(baseQueueName, partitionKey);

    return this.getOrCreate(queueName, () =>
      this.createQueue(queueName, this.findConfig(baseQueueName)),
    );
  }

  async closeAll(): Promise<void> {
    const queues = await Promise.all(this.queues.values());

    await Promise.all(
      queues.map(async (queue) => {
        try {
          await queue.close();
        } catch {
          // ignore shutdown errors
        }
      }),
    );

    this.queues.clear();
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeAll();
  }

  private async getOrCreate(queueName: string, factory: () => Promise<Queue>): Promise<Queue> {
    const existing = this.queues.get(queueName);

    if (existing) {
      return existing;
    }

    const queuePromise = factory().catch((error) => {
      /**
       * Important:
       * Remove failed creations from cache so a future
       * call can retry instead of permanently returning
       * a rejected promise.
       */
      this.queues.delete(queueName);
      throw error;
    });

    this.queues.set(queueName, queuePromise);

    return queuePromise;
  }

  private async createQueue(queueName: string, config?: QueueConfig): Promise<Queue> {
    return new Queue(queueName, {
      connection: this.redis,

      ...(config?.defaultJobOptions && {
        defaultJobOptions: config.defaultJobOptions,
      }),

      ...(config?.limiter && {
        limiter: config.limiter,
      }),
    });
  }

  private buildPartitionedQueueName(baseQueueName: string, partitionKey: string): string {
    return `${baseQueueName}:${partitionKey}`;
  }

  private findConfig(queueName: string): QueueConfig | undefined {
    return this.configs.find((config) => config.name === queueName);
  }
}
