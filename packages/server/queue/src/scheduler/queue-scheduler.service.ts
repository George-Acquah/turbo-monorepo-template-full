/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from '@nestjs/common';
import type { Queue, RepeatOptions } from 'bullmq';
import { LOGGER_TOKEN, LoggerPort, QueueSchedulerPort } from '@repo/ports';

@Injectable()
export class QueueSchedulerService implements QueueSchedulerPort {
  private readonly context = QueueSchedulerService.name;

  constructor(@Inject(LOGGER_TOKEN) private readonly logger: LoggerPort) {}

  /**
   * Register/update a repeatable job using BullMQ Job Schedulers (v5+).
   *
   * Why:
   * - BullMQ deprecated getRepeatableJobs/removeRepeatableByKey.
   * - Job Schedulers are the forward-compatible API.
   *
   * Implementation notes:
   * - We use `schedulerId` as the stable identity for the scheduler.
   * - `jobId` (optional) is for the produced executions, not the scheduler itself.
   */
  async upsertRepeatableJob<TData>(
    queue: Queue<TData, unknown, string>,
    jobName: string,
    payload: TData,
    repeat: RepeatOptions,
    opts?: {
      schedulerId?: string;
      jobId?: string;
      replace?: boolean;
    },
  ): Promise<void> {
    const replace = opts?.replace ?? true;

    // Stable scheduler identity.
    // If you want cross-env stability, pass schedulerId explicitly.
    const schedulerId = opts?.schedulerId ?? `${queue.name}:${jobName}`;

    // BullMQ job schedulers do NOT accept repeat.key in upsert (it’s derived).
    // So we strip it out to match the Omit<RepeatOptions, "key"> signature.
    // (RepeatOptions typing differs slightly across BullMQ minor versions.)
    const { key: _ignored, ...repeatOpts } = repeat as RepeatOptions & { key?: string };

    if (replace) {
      // Best-effort remove; ok if it doesn’t exist.
      try {
        await queue.removeJobScheduler(schedulerId);
      } catch {
        // ignore
      }
    }

    // Upsert scheduler + create first delayed job.
    await queue.upsertJobScheduler(schedulerId as any, repeatOpts as any, {
      name: jobName as any,
      data: payload as any,
      opts: {
        // This opts is JobSchedulerTemplateOptions (BullMQ), not JobsOptions.
        // Keep it minimal; per-execution retries etc are better configured on the queue defaults.
        jobId: opts?.jobId,
        removeOnComplete: true,
        removeOnFail: false,
      } as any,
    });

    this.logger.log(
      `Upserted job scheduler: queue=${queue.name} schedulerId=${schedulerId} jobName=${jobName}`,
      this.context,
    );
  }

  async removeRepeatableJob(
    queue: Queue<unknown, unknown, string>,
    schedulerId: string,
  ): Promise<boolean> {
    try {
      const removed = await queue.removeJobScheduler(schedulerId);
      if (removed) {
        this.logger.log(
          `Removed job scheduler: queue=${queue.name} schedulerId=${schedulerId}`,
          this.context,
        );
      }
      return removed;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `Failed to remove job scheduler: queue=${queue.name} schedulerId=${schedulerId} err=${msg}`,
        this.context,
      );
      return false;
    }
  }
}
