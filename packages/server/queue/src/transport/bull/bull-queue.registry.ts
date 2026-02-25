import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';

import { REDIS_BULLMQ_CLIENT } from '@repo/constants';
import type { RedisClient } from '@repo/redis';

import { QueueRegistryPort } from '@repo/ports';

import { QUEUE_CONFIGS_TOKEN, type QueueConfig } from '../../interfaces/queue.interface';

@Injectable()
export class BullQueueRegistry implements QueueRegistryPort, OnModuleDestroy {
  private readonly queues = new Map<string, Queue>();

  constructor(
    @Inject(REDIS_BULLMQ_CLIENT) private readonly redis: RedisClient,
    @Inject(QUEUE_CONFIGS_TOKEN) private readonly configs: QueueConfig[],
  ) {}

  async getOrCreateQueue(queueName: string): Promise<Queue> {
    const existing = this.queues.get(queueName);
    if (existing) return existing;

    const cfg = this.findConfig(queueName);

    const queue = new Queue(queueName, {
      connection: this.redis,
      ...(cfg?.defaultJobOptions && { defaultJobOptions: cfg.defaultJobOptions }),
      ...(cfg?.limiter && { limiter: cfg.limiter }),
    });

    this.queues.set(queueName, queue);
    return queue;
  }

  async getOrCreatePartitionedQueue(baseQueueName: string, partitionKey: string): Promise<Queue> {
    const queueName = this.buildPartitionedQueueName(baseQueueName, partitionKey);
    const existing = this.queues.get(queueName);
    if (existing) return existing;

    // Inherit settings from base queue config
    const cfg = this.findConfig(baseQueueName);

    const queue = new Queue(queueName, {
      connection: this.redis,
      ...(cfg?.defaultJobOptions && { defaultJobOptions: cfg.defaultJobOptions }),
      ...(cfg?.limiter && { limiter: cfg.limiter }),
    });

    this.queues.set(queueName, queue);
    return queue;
  }

  async closeAll(): Promise<void> {
    const queues = Array.from(this.queues.values());
    await Promise.all(queues.map((q) => q.close()));
    this.queues.clear();
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeAll();
  }

  private buildPartitionedQueueName(baseQueueName: string, partitionKey: string): string {
    return `${baseQueueName}:${partitionKey}`;
  }

  private findConfig(queueName: string): QueueConfig | undefined {
    return this.configs.find((c) => c.name === queueName);
  }
}
