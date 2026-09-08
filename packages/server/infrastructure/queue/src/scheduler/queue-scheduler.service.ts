import { Inject, Injectable } from '@nestjs/common';
import type { Queue, RepeatOptions } from 'bullmq';

import {
  LOGGER_TOKEN,
  LoggerPort,
  QueueRegistryPort,
  QueueSchedulerPort,
  QUEUE_REGISTRY_TOKEN,
} from '@workspace/ports';

import { QueueName } from '@workspace/constants';

@Injectable()
export class QueueSchedulerService implements QueueSchedulerPort {
  private readonly context = QueueSchedulerService.name;

  constructor(
    @Inject(QUEUE_REGISTRY_TOKEN)
    private readonly registry: QueueRegistryPort,

    @Inject(LOGGER_TOKEN)
    private readonly logger: LoggerPort,
  ) {}

  private async getQueue(name: QueueName): Promise<Queue> {
    return (await this.registry.getOrCreateQueue(name)) as Queue;
  }

  async upsertRepeatableJob<TData>(
    queue: QueueName,
    jobName: string,
    payload: TData,
    repeat: RepeatOptions,
    opts?: {
      schedulerId?: string;
      jobId?: string;
      replace?: boolean;
    },
  ): Promise<void> {
    const targetQueue = await this.getQueue(queue);

    const schedulerId = opts?.schedulerId ?? `${queue}:${jobName}`;
    const replace = opts?.replace ?? true;

    const { key: _ignored, ...repeatOpts } = repeat as RepeatOptions & {
      key?: string;
    };

    if (replace) {
      try {
        await targetQueue.removeJobScheduler(schedulerId);
      } catch {
        // scheduler doesn't exist yet
      }
    }

    await targetQueue.upsertJobScheduler(schedulerId, repeatOpts, {
      name: jobName,
      data: payload,
      opts: {
        // jobId: opts?.jobId,
        removeOnComplete: true,
        // Bounded, not `false`. Repeatable jobs fire forever, so retaining
        // every failure retained them without limit — a sustained failure on a
        // frequent scheduler (the outbox drain fires ~5.8k times a day) grows
        // Redis memory until something evicts. Keeping the most recent 100 is
        // enough to diagnose from while staying flat.
        removeOnFail: 100,
      },
    });

    this.logger.log(
      `Upserted scheduler [queue=${queue}] [scheduler=${schedulerId}] [job=${jobName}]`,
      this.context,
    );
  }

  async removeRepeatableJob(queue: QueueName, schedulerId: string): Promise<boolean> {
    try {
      const targetQueue = await this.getQueue(queue);

      const removed = await targetQueue.removeJobScheduler(schedulerId);

      if (removed) {
        this.logger.log(
          `Removed scheduler [queue=${queue}] [scheduler=${schedulerId}]`,
          this.context,
        );
      }

      return removed;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.warn(
        `Failed removing scheduler [queue=${queue}] [scheduler=${schedulerId}] [error=${message}]`,
        this.context,
      );

      return false;
    }
  }
}
