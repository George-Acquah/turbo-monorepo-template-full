import { Inject, Injectable } from '@nestjs/common';
import {
  FILE_RECORD_REPOSITORY_TOKEN,
  type FileRecordRepositoryPort,
  STORAGE_PORT_TOKEN,
  type StoragePort,
  type FilesApplicationPort,
  type SignedFileUrl,
} from '@workspace/ports';

/**
 * Implements `FilesApplicationPort` — the sanctioned cross-context seam
 * other modules use instead of importing `ports/database/schema/files/**`
 * directly. Bound to `FILES_APPLICATION_TOKEN` in `FilesApplicationPortModule`.
 * Consumed by `modules/learning`'s lesson/replay endpoints.
 */
@Injectable()
export class FilesApplicationService implements FilesApplicationPort {
  constructor(
    @Inject(FILE_RECORD_REPOSITORY_TOKEN) private readonly fileRecordRepo: FileRecordRepositoryPort,
    @Inject(STORAGE_PORT_TOKEN) private readonly storage: StoragePort,
  ) {}

  async getSignedUrlForFile(fileId: string): Promise<SignedFileUrl | null> {
    const file = await this.fileRecordRepo.findById(fileId);
    if (!file || file.deletedAt) {
      return null;
    }

    return this.storage.getDownloadUrl({ bucket: file.bucket, key: file.objectKey });
  }
}
