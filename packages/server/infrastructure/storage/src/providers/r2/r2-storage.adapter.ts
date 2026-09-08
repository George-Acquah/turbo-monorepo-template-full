import { S3StorageAdapter } from '../s3/s3-storage.adapter';
import type {
  PutObjectInput,
  ReadObjectResult,
  SignedDownload,
  StoredObject,
  StorageObjectRef,
  StoragePort,
} from '@workspace/ports';
import type { StorageRuntimeConfig } from '@workspace/ports/config';

/**
 * R2StorageAdapter delegates to the S3StorageAdapter but exists as a separate
 * named adapter to keep provider-specific wiring explicit and preserve SOLID
 * boundaries. Cloudflare R2 is S3-compatible so the S3 client is used under
 * the hood via the S3StorageAdapter.
 */
export class R2StorageAdapter implements StoragePort {
  private readonly delegate: S3StorageAdapter;

  constructor(private readonly config: StorageRuntimeConfig) {
    this.delegate = new S3StorageAdapter(config);
  }

  putObject(input: PutObjectInput): Promise<StoredObject> {
    return this.delegate.putObject(input);
  }

  deleteObject(input: StorageObjectRef): Promise<void> {
    return this.delegate.deleteObject(input);
  }

  exists(input: StorageObjectRef): Promise<boolean> {
    return this.delegate.exists(input);
  }

  getPublicUrl(input: StorageObjectRef): string | null {
    return this.delegate.getPublicUrl(input);
  }

  getDownloadUrl(input: StorageObjectRef): Promise<SignedDownload> {
    return this.delegate.getDownloadUrl(input);
  }

  getUploadUrl(
    input: StorageObjectRef & { contentType?: string },
    ttlSeconds?: number,
  ): Promise<SignedDownload> {
    return this.delegate.getUploadUrl(input, ttlSeconds);
  }

  readObject(input: StorageObjectRef): Promise<ReadObjectResult> {
    return this.delegate.readObject(input);
  }
}
