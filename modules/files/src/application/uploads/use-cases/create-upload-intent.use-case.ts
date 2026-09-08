import { Inject, Injectable } from '@nestjs/common';
import {
  FILE_UPLOAD_REPOSITORY_TOKEN,
  type FileUploadRepositoryPort,
  STORAGE_PORT_TOKEN,
  type StoragePort,
} from '@workspace/ports';
import { STORAGE_RUNTIME_CONFIG_TOKEN, type StorageRuntimeConfig } from '@workspace/ports/config';
import {
  FileErrorCodes,
  FilePurposeConstraints,
  FilePurposeVisibility,
  FileVisibility,
} from '@workspace/constants';
import { generateId, BadRequestAppException } from '@workspace/utils';
import type { CreateUploadIntentUseCaseInput, CreateUploadIntentResult } from '../dto/upload.dto';

const UPLOAD_INTENT_TTL_SECONDS = 15 * 60;

const PURPOSE_PREFIX: Record<string, string> = {
  LESSON_VIDEO: 'lessons',
  REPLAY_VIDEO: 'replays',
  RESOURCE: 'resources',
  RECEIPT_PDF: 'receipts',
  AVATAR: 'avatars',
  OTHER: 'other',
};

const EXTENSION_BY_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'application/zip': 'zip',
};

/**
 * `POST /v1/files/uploads` (doc 09 §1 upload flow, step 1). Validates the
 * intent against `FilePurposeConstraints`, builds a purpose-scoped object
 * key, and returns a presigned PUT URL — no bytes touch this server.
 */
@Injectable()
export class CreateUploadIntentUseCase {
  constructor(
    @Inject(FILE_UPLOAD_REPOSITORY_TOKEN) private readonly fileUploadRepo: FileUploadRepositoryPort,
    @Inject(STORAGE_PORT_TOKEN) private readonly storage: StoragePort,
    @Inject(STORAGE_RUNTIME_CONFIG_TOKEN) private readonly storageConfig: StorageRuntimeConfig,
  ) {}

  async execute(input: CreateUploadIntentUseCaseInput): Promise<CreateUploadIntentResult> {
    const constraints = FilePurposeConstraints[input.purpose];

    if (!(constraints.allowedMimeTypes as string[]).includes(input.mimeType)) {
      throw new BadRequestAppException(
        FileErrorCodes.FILE_TYPE_NOT_ALLOWED,
        `"${input.mimeType}" is not allowed for purpose "${input.purpose}"`,
      );
    }

    if (input.sizeBytes <= 0 || input.sizeBytes > constraints.maxSizeBytes) {
      throw new BadRequestAppException(
        FileErrorCodes.FILE_SIZE_LIMIT_EXCEEDED,
        `File size ${input.sizeBytes} exceeds the ${constraints.maxSizeBytes}-byte limit for purpose "${input.purpose}"`,
      );
    }

    const bucket = this.resolveBucket(input.purpose);
    const objectKey = this.buildObjectKey(input);

    const upload = await this.fileUploadRepo.create({
      profileId: input.profileId ?? null,
      userId: input.userId ?? null,
      expectedMime: input.mimeType,
      expectedBytes: input.sizeBytes,
      bucket,
      objectKey,
      purpose: input.purpose,
      expiresAt: new Date(Date.now() + UPLOAD_INTENT_TTL_SECONDS * 1000),
    });

    const signed = await this.storage.getUploadUrl(
      { bucket, key: objectKey, contentType: input.mimeType },
      UPLOAD_INTENT_TTL_SECONDS,
    );

    return {
      uploadId: upload.id,
      presignedUrl: signed.url,
      expiresAt: signed.expiresAt ?? upload.expiresAt,
    };
  }

  /**
   * `AVATAR` (and any other future `FileVisibility.PUBLIC` purpose) uploads
   * into the public bucket; everything else stays in the private bucket. See
   * `FilePurposeVisibility` (`@workspace/constants`) for the source mapping.
   */
  private resolveBucket(purpose: CreateUploadIntentUseCaseInput['purpose']): string {
    const isPublic = FilePurposeVisibility[purpose] === FileVisibility.PUBLIC;
    if (isPublic && this.storageConfig.s3.publicBucket) {
      return this.storageConfig.s3.publicBucket;
    }

    return this.storageConfig.defaultBucket;
  }

  private buildObjectKey(input: CreateUploadIntentUseCaseInput): string {
    const prefix = PURPOSE_PREFIX[input.purpose] ?? 'other';
    const owner = input.profileId ?? input.userId ?? 'admin';
    const extension = EXTENSION_BY_MIME[input.mimeType];
    const filename = extension ? `${generateId()}.${extension}` : generateId();
    return `${prefix}/${owner}/${filename}`;
  }
}
