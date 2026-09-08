import { Module } from '@nestjs/common';
import { FilesPersistenceModule } from '@workspace/files-persistence';
import { QueueModule, createQueueConsumer } from '@workspace/queue';
import { QueueNames } from '@workspace/constants';
import { ExpireUploadsUseCase } from './application/uploads/use-cases/expire-uploads.use-case';
import { ProcessFileUploadProcessor } from './infrastructure/processors/process-file-upload.processor';
import { ExpireUploadsProcessor } from './infrastructure/processors/expire-uploads.processor';
import { FileCleanupSchedulerService } from './infrastructure/schedulers/file-cleanup-scheduler.service';

/**
 * Worker composition root — the REACTING half of the files context.
 *
 * Imported by apps/worker (never apps/api). Registers two queues, each with
 * its own single processor (a queue's generated consumer dispatches every
 * job on it to one processor regardless of job name — see
 * `expire-uploads.processor.ts`'s doc comment):
 * - `FILE_PROCESSING`: `PROCESS_FILE_UPLOAD` job → `ProcessFileUploadProcessor`
 *   (the AV-scan-hook stub).
 * - `FILE_CLEANUP`: `CLEANUP_ORPHANED_FILES` job → `ExpireUploadsProcessor`,
 *   registered as a daily repeatable job by `FileCleanupSchedulerService`.
 *
 * No domain-event reactions this pass — nothing consumes `FILE_UPLOADED` yet
 * besides this module's own queue-invoked scan stub.
 */
@Module({
  imports: [
    FilesPersistenceModule,
    QueueModule.registerQueues([
      { name: QueueNames.FILE_PROCESSING },
      { name: QueueNames.FILE_CLEANUP },
    ]),
  ],
  providers: [
    ExpireUploadsUseCase,
    ProcessFileUploadProcessor,
    ExpireUploadsProcessor,
    FileCleanupSchedulerService,
    createQueueConsumer(QueueNames.FILE_PROCESSING, ProcessFileUploadProcessor),
    createQueueConsumer(QueueNames.FILE_CLEANUP, ExpireUploadsProcessor),
  ],
})
export class FilesWorkerModule {}
