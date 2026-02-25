export interface UpsertRepeatableJobOptions {
  /** Stable scheduler id (recommended). If omitted, implementation will derive one. */
  schedulerId?: string;
  /** Optional stable jobId for the produced executions (not the scheduler id). */
  jobId?: string;
  /** If true, remove the scheduler first (best-effort). Default: true. */
  replace?: boolean;
}

export abstract class QueueSchedulerPort {
  abstract upsertRepeatableJob<TData>(
    queue: unknown,
    jobName: string,
    payload: TData,
    repeat: unknown,
    opts?: UpsertRepeatableJobOptions,
  ): Promise<void>;

  abstract removeRepeatableJob(queue: unknown, schedulerId: string): Promise<boolean>;
}

export const QUEUE_SCHEDULER_TOKEN = Symbol('QUEUE_SCHEDULER_TOKEN');
