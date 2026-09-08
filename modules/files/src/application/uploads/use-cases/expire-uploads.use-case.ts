import { Inject, Injectable } from '@nestjs/common';
import { FILE_UPLOAD_REPOSITORY_TOKEN, type FileUploadRepositoryPort } from '@workspace/ports';
import { FileUploadStatus } from '@workspace/constants';

/**
 * `CLEANUP_ORPHANED_FILES` job body (doc 12 Phase 7 roster: "uploads never
 * completed") — sweeps `FileUpload` intents whose `expiresAt` has passed and
 * were never consumed, marking them `EXPIRED`.
 */
@Injectable()
export class ExpireUploadsUseCase {
  constructor(
    @Inject(FILE_UPLOAD_REPOSITORY_TOKEN) private readonly fileUploadRepo: FileUploadRepositoryPort,
  ) {}

  async execute(): Promise<void> {
    const expired = await this.fileUploadRepo.findExpired(new Date());
    for (const upload of expired) {
      if (upload.status !== FileUploadStatus.PENDING) continue;
      await this.fileUploadRepo.update(upload.id, { status: FileUploadStatus.EXPIRED });
    }
  }
}
