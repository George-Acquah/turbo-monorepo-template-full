import { Inject, Injectable } from '@nestjs/common';
import {
  FILE_UPLOAD_REPOSITORY_TOKEN,
  type FileUploadRepositoryPort,
  FILE_RECORD_REPOSITORY_TOKEN,
  type FileRecordRepositoryPort,
  STORAGE_PORT_TOKEN,
  type StoragePort,
  EVENT_PUBLISHER_TOKEN,
  type EventPublisherPort,
  QUEUE_BUS_TOKEN,
  type QueueBusPort,
} from '@workspace/ports';
import { STORAGE_RUNTIME_CONFIG_TOKEN, type StorageRuntimeConfig } from '@workspace/ports/config';
import {
  AggregateType,
  FileErrorCodes,
  FilePurposeVisibility,
  FileScanStatus,
  FileUploadStatus,
  QueueNames,
  JobNames,
} from '@workspace/constants';
import { FilesEvents } from '@workspace/types';
import { ConflictAppException, ForbiddenAppException, NotFoundAppException } from '@workspace/utils';
import type { CompleteUploadUseCaseInput, CompleteUploadResult } from '../dto/upload.dto';

/**
 * `POST /v1/files/uploads/:uploadId/complete` (doc 09 §1 upload flow, step
 * 2). Confirms the object actually landed in storage, creates the
 * `FileRecord`, marks the intent consumed, publishes `FILE_UPLOADED`.
 *
 * Scoped-down deliberately: real checksum verification would mean reading
 * the object back (wasteful for a multi-GB video) — this pass trusts the
 * client-declared size/mime the intent already validated, and only confirms
 * the object *exists*. A real checksum comparison is a documented gap, not
 * an oversight.
 */
@Injectable()
export class CompleteUploadUseCase {
  constructor(
    @Inject(FILE_UPLOAD_REPOSITORY_TOKEN) private readonly fileUploadRepo: FileUploadRepositoryPort,
    @Inject(FILE_RECORD_REPOSITORY_TOKEN) private readonly fileRecordRepo: FileRecordRepositoryPort,
    @Inject(STORAGE_PORT_TOKEN) private readonly storage: StoragePort,
    @Inject(STORAGE_RUNTIME_CONFIG_TOKEN) private readonly storageConfig: StorageRuntimeConfig,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(QUEUE_BUS_TOKEN) private readonly queueBus: QueueBusPort,
  ) {}

  async execute(input: CompleteUploadUseCaseInput): Promise<CompleteUploadResult> {
    const upload = await this.fileUploadRepo.findById(input.uploadId);
    if (!upload) {
      throw new NotFoundAppException(FileErrorCodes.FILE_NOT_FOUND, `Upload "${input.uploadId}" not found`);
    }

    const isOwner =
      (input.profileId && upload.profileId === input.profileId) ||
      (input.userId && upload.userId === input.userId);
    if (!isOwner) {
      throw new ForbiddenAppException(
        FileErrorCodes.FILE_ACCESS_DENIED,
        'This upload intent does not belong to the caller',
      );
    }

    if (upload.status === FileUploadStatus.CONSUMED && upload.fileId) {
      return { fileId: upload.fileId };
    }

    if (upload.status !== FileUploadStatus.PENDING) {
      throw new ConflictAppException(
        FileErrorCodes.FILE_UPLOAD_FAILED,
        `Upload "${upload.id}" is no longer pending (status: ${upload.status})`,
      );
    }

    if (upload.expiresAt.getTime() < Date.now()) {
      await this.fileUploadRepo.update(upload.id, { status: FileUploadStatus.EXPIRED });
      throw new ConflictAppException(FileErrorCodes.FILE_UPLOAD_FAILED, `Upload "${upload.id}" has expired`);
    }

    const exists = await this.storage.exists({ bucket: upload.bucket, key: upload.objectKey });
    if (!exists) {
      throw new ConflictAppException(
        FileErrorCodes.FILE_UPLOAD_FAILED,
        'The uploaded object was not found in storage',
      );
    }

    const fileRecord = await this.fileRecordRepo.create({
      ownerProfileId: upload.profileId,
      uploadedByUserId: upload.userId,
      storageProvider: this.storageConfig.provider,
      bucket: upload.bucket,
      objectKey: upload.objectKey,
      mimeType: upload.expectedMime,
      sizeBytes: upload.expectedBytes ?? 0,
      checksumSha256: null,
      visibility: FilePurposeVisibility[upload.purpose],
      scanStatus: FileScanStatus.PENDING,
      purpose: upload.purpose,
      metadata: null,
    });

    await this.fileUploadRepo.markConsumed(upload.id, fileRecord.id);

    await this.publisher.publish({
      eventType: FilesEvents.FILE_UPLOADED,
      aggregateType: AggregateType.FILE,
      aggregateId: fileRecord.id,
      payload: {
        fileId: fileRecord.id,
        uploadId: upload.id,
        ownerProfileId: fileRecord.ownerProfileId ?? undefined,
        uploadedByUserId: fileRecord.uploadedByUserId ?? undefined,
        purpose: fileRecord.purpose,
        mimeType: fileRecord.mimeType,
        sizeBytes: fileRecord.sizeBytes,
        checksumSha256: fileRecord.checksumSha256 ?? undefined,
        bucket: fileRecord.bucket,
        objectKey: fileRecord.objectKey,
      },
    });

    await this.queueBus.enqueue(QueueNames.FILE_PROCESSING, JobNames.PROCESS_FILE_UPLOAD, {
      fileId: fileRecord.id,
    });

    return { fileId: fileRecord.id };
  }
}
