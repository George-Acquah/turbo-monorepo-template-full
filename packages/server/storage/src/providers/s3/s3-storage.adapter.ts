import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  PutObjectInput,
  SignedDownload,
  StoredObject,
  StorageObjectBody,
  StorageObjectRef,
  StoragePort,
} from '@repo/ports';
import type { StorageRuntimeConfig } from '@repo/config';

const DEFAULT_SIGNED_URL_TTL_SECONDS = 15 * 60;

export class S3StorageAdapter implements StoragePort {
  private readonly client: S3Client;

  constructor(private readonly config: StorageRuntimeConfig) {
    this.client = new S3Client({
      endpoint: config.s3.endpoint || undefined,
      region: config.s3.region || 'auto',
      forcePathStyle: config.s3.forcePathStyle,
      credentials:
        config.s3.accessKeyId && config.s3.secretAccessKey
          ? {
              accessKeyId: config.s3.accessKeyId,
              secretAccessKey: config.s3.secretAccessKey,
            }
          : undefined,
    });
  }

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const bucket = this.resolveBucket(input.bucket);
    const key = normalizeStorageKey(input.key);
    const body = normalizeBody(input.body);

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: input.contentType,
        Metadata: input.metadata,
      }),
    );

    return {
      bucket,
      key,
      contentType: input.contentType,
      size: body.byteLength,
      url: this.getPublicUrl({ bucket, key }),
    };
  }

  async deleteObject(input: StorageObjectRef): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.resolveBucket(input.bucket),
        Key: normalizeStorageKey(input.key),
      }),
    );
  }

  async exists(input: StorageObjectRef): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.resolveBucket(input.bucket),
          Key: normalizeStorageKey(input.key),
        }),
      );

      return true;
    } catch (error) {
      if (isMissingObjectError(error)) {
        return false;
      }

      throw error;
    }
  }

  getPublicUrl(input: StorageObjectRef): string | null {
    const bucket = this.resolveBucket(input.bucket);
    const key = encodeStorageKey(normalizeStorageKey(input.key));

    if (this.config.publicBaseUrl) {
      const baseUrl = this.config.publicBaseUrl.endsWith('/')
        ? this.config.publicBaseUrl
        : `${this.config.publicBaseUrl}/`;

      return new URL(`${encodeURIComponent(bucket)}/${key}`, baseUrl).toString();
    }

    if (this.config.s3.endpoint) {
      const endpoint = new URL(this.config.s3.endpoint);
      if (this.config.s3.forcePathStyle) {
        return new URL(`${encodeURIComponent(bucket)}/${key}`, ensureTrailingSlash(endpoint)).toString();
      }

      endpoint.hostname = `${bucket}.${endpoint.hostname}`;
      endpoint.pathname = `/${key}`;
      return endpoint.toString();
    }

    if (this.config.provider === 's3' && this.config.s3.region) {
      return `https://${bucket}.s3.${this.config.s3.region}.amazonaws.com/${key}`;
    }

    return null;
  }

  async getDownloadUrl(input: StorageObjectRef): Promise<SignedDownload> {
    const bucket = this.resolveBucket(input.bucket);
    const key = normalizeStorageKey(input.key);
    const publicUrl = this.getPublicUrl({ bucket, key });

    if (publicUrl) {
      return { url: publicUrl };
    }

    const expiresIn = DEFAULT_SIGNED_URL_TTL_SECONDS;
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      { expiresIn },
    );

    return {
      url,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  private resolveBucket(bucket?: string): string {
    const value = bucket?.trim() || this.config.s3.bucket?.trim() || this.config.defaultBucket.trim();
    if (!value) {
      throw new Error('Storage bucket cannot be empty.');
    }

    return value;
  }
}

function normalizeBody(body: StorageObjectBody): Uint8Array {
  if (typeof body === 'string') {
    return Buffer.from(body);
  }

  return body;
}

function normalizeStorageKey(key: string): string {
  const trimmed = key.trim().replace(/\\/g, '/');
  if (!trimmed) {
    throw new Error('Storage key cannot be empty.');
  }

  return trimmed
    .split('/')
    .filter(Boolean)
    .join('/');
}

function encodeStorageKey(key: string): string {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function ensureTrailingSlash(url: URL): string {
  const href = url.toString();
  return href.endsWith('/') ? href : `${href}/`;
}

function isMissingObjectError(error: unknown): boolean {
  const statusCode =
    typeof error === 'object' && error && '$metadata' in error
      ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
      : undefined;
  const name =
    typeof error === 'object' && error && 'name' in error
      ? String((error as { name?: string }).name)
      : '';

  return statusCode === 404 || name === 'NotFound' || name === 'NoSuchKey';
}
