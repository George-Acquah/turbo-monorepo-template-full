import { Inject, Injectable } from '@nestjs/common';
import { QueueBusPort, QUEUE_REGISTRY_TOKEN, QueueRegistryPort, EnqueueJob } from '@repo/ports';
import type { BulkJobOptions, JobsOptions, Queue } from 'bullmq';

@Injectable()
export class BullQueueBus implements QueueBusPort {
  constructor(@Inject(QUEUE_REGISTRY_TOKEN) private readonly registry: QueueRegistryPort) {}

  async enqueue<T>(
    queueName: string,
    jobName: string,
    payload: T,
    opts?: JobsOptions,
  ): Promise<string> {
    const queue = (await this.registry.getOrCreateQueue(queueName)) as Queue;
    const job = await queue.add(jobName, payload, opts);
    return String(job.id);
  }

  async enqueueMany<T>(queueName: string, jobs: Array<EnqueueJob<T>>): Promise<string[]> {
    const queue = (await this.registry.getOrCreateQueue(queueName)) as Queue;

    // BullMQ supports addBulk
    const created = await queue.addBulk(
      jobs.map((j) => ({
        name: j.name,
        data: j.data,
        opts: j.opts as BulkJobOptions,
      })),
    );

    return created.map((j) => String(j.id));
  }

  async enqueuePartitioned<T>(
    baseQueueName: string,
    partitionKey: string,
    jobName: string,
    payload: T,
    opts?: JobsOptions,
  ): Promise<string> {
    const queue = (await this.registry.getOrCreatePartitionedQueue(
      baseQueueName,
      partitionKey,
    )) as Queue;
    const job = await queue.add(jobName, payload, opts);
    return String(job.id);
  }
}
