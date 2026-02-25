import { WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { LOGGER_TOKEN, LoggerPort } from '@repo/ports';
import type { Job } from 'bullmq';

export abstract class QueueProcessor<T = unknown> extends WorkerHost {
  protected readonly context: string;

  @Inject(LOGGER_TOKEN)
  protected readonly logger!: LoggerPort;

  protected constructor(context?: string) {
    super();
    this.context = context ?? this.constructor.name;
  }

  /**
   * Must be implemented by subclasses.
   */
  protected abstract handle(job: Job<T>): Promise<void>;

  /**
   * DO NOT override.
   * Provides a consistent lifecycle + logging contract.
   */
  async process(job: Job<T>): Promise<void> {
    this.onJobStart(job);

    const startedAt = Date.now();

    try {
      await this.handle(job);

      const duration = Date.now() - startedAt;
      this.onJobComplete(job, duration);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.onJobFailed(job, error);
      throw err;
    }
  }

  // --------------------------
  // Default lifecycle behavior
  // --------------------------

  protected onJobStart(job: Job<T>): void {
    this.logger.debug(`Job started [jobId=${job.id}, name=${job.name}]`, this.context);
  }

  protected onJobComplete(job: Job<T>, durationMs: number): void {
    this.logger.debug(`Job completed [jobId=${job.id}] in ${durationMs}ms`, this.context);
  }

  protected onJobFailed(job: Job<T>, error: Error): void {
    this.logger.error(`Job failed [jobId=${job?.id}]: ${error.message}`, error.stack, this.context);
  }

  protected async updateProgress(job: Job<T>, progress: number | object): Promise<void> {
    await job.updateProgress(progress);
    this.onJobProgress(job, progress);
  }

  protected onJobProgress(job: Job<T>, progress: number | object): void {
    this.logger.debug(`Job progress [jobId=${job.id}]: ${JSON.stringify(progress)}`, this.context);
  }
}
