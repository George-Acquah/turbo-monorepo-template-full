import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { QueueNames, JobNames } from '@workspace/constants';
import { QUEUE_SCHEDULER_TOKEN, type QueueSchedulerPort } from '@workspace/ports';

/**
 * Registers the daily `CLEANUP_ORPHANED_FILES` repeatable job at worker
 * boot (doc 12 Phase 7: "daily 03:30 | uploads never completed") — the
 * second real consumer of `QueueSchedulerService` after
 * `SubscriptionRenewalSchedulerService`, mirrored exactly.
 */
@Injectable()
export class FileCleanupSchedulerService implements OnModuleInit {
  private readonly schedulerId = `${QueueNames.FILE_CLEANUP}:${JobNames.CLEANUP_ORPHANED_FILES}`;

  constructor(@Inject(QUEUE_SCHEDULER_TOKEN) private readonly scheduler: QueueSchedulerPort) {}

  async onModuleInit(): Promise<void> {
    await this.scheduler.upsertRepeatableJob(
      QueueNames.FILE_CLEANUP,
      JobNames.CLEANUP_ORPHANED_FILES,
      { batchId: 'file-uploads-cleanup' },
      { pattern: '30 3 * * *', tz: 'UTC' },
      {
        schedulerId: this.schedulerId,
        replace: true,
      },
    );
  }
}
