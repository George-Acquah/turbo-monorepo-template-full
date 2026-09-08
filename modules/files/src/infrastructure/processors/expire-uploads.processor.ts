import { Injectable } from '@nestjs/common';
import type { QueueJobProcessor } from '@workspace/ports';
import { ExpireUploadsUseCase } from '../../application/uploads/use-cases/expire-uploads.use-case';

export interface ExpireUploadsJobData {
  batchId: string;
}

/**
 * `createQueueConsumer`-backed, on its own `QueueNames.FILE_CLEANUP` queue —
 * kept separate from `QueueNames.SCHEDULED_JOBS` (already owned by
 * `modules/memberships`' subscription renewal scanner) since a queue's
 * generated consumer dispatches every job on it to one processor,
 * regardless of job name.
 */
@Injectable()
export class ExpireUploadsProcessor implements QueueJobProcessor<ExpireUploadsJobData> {
  constructor(private readonly expireUploadsUseCase: ExpireUploadsUseCase) {}

  async process(): Promise<void> {
    await this.expireUploadsUseCase.execute();
  }
}
