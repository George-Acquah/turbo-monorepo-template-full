import { Inject, Injectable } from '@nestjs/common';
import {
  FILE_RECORD_REPOSITORY_TOKEN,
  type FileRecordRepositoryPort,
  type QueueJobProcessor,
} from '@workspace/ports';
import { FileScanStatus } from '@workspace/constants';

export interface ProcessFileUploadJobData {
  fileId: string;
}

/**
 * `createQueueConsumer`-backed, on `QueueNames.FILE_PROCESSING`. Stands in
 * for doc 09 §1's "AV scan hook" — no real virus-scanning integration exists
 * yet, so this just marks `scanStatus: CLEAN` immediately. Documented
 * deliberately as a stub, not claimed as a production scan pipeline.
 */
@Injectable()
export class ProcessFileUploadProcessor implements QueueJobProcessor<ProcessFileUploadJobData> {
  constructor(
    @Inject(FILE_RECORD_REPOSITORY_TOKEN) private readonly fileRecordRepo: FileRecordRepositoryPort,
  ) {}

  async process(data: ProcessFileUploadJobData): Promise<void> {
    await this.fileRecordRepo.update(data.fileId, { scanStatus: FileScanStatus.CLEAN });
  }
}
