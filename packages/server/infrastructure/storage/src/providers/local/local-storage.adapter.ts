import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, normalize, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
  PutObjectInput,
  ReadObjectResult,
  SignedDownload,
  StoredObject,
  StorageObjectBody,
  StorageObjectRef,
  StoragePort,
} from '@workspace/ports';
import type { StorageRuntimeConfig } from '@workspace/ports/config';

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png', 
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
};

export class LocalStorageAdapter implements StoragePort {
  constructor(private readonly config: StorageRuntimeConfig) {}

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const bucket = this.resolveBucket(input.bucket);
    const key = normalizeStorageKey(input.key);
    const filePath = this.resolveObjectPath(bucket, key);
    const body = normalizeBody(input.body);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, body);

    return {
      bucket,
      key,
      contentType: input.contentType,
      size: body.byteLength,
      url: this.getPublicUrl({ bucket, key }),
    };
  }

  async deleteObject(input: StorageObjectRef): Promise<void> {
    const bucket = this.resolveBucket(input.bucket);
    const key = normalizeStorageKey(input.key);

    await rm(this.resolveObjectPath(bucket, key), {
      force: true,
    });
  }

  async exists(input: StorageObjectRef): Promise<boolean> {
    const bucket = this.resolveBucket(input.bucket);
    const key = normalizeStorageKey(input.key);

    try {
      await access(this.resolveObjectPath(bucket, key));
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(input: StorageObjectRef): string | null {
    if (!this.config.publicBaseUrl) {
      return null;
    }

    const bucket = encodeUrlSegment(this.resolveBucket(input.bucket));
    const key = normalizeStorageKey(input.key).split('/').map(encodeUrlSegment).join('/');

    const baseUrl = this.config.publicBaseUrl.endsWith('/')
      ? this.config.publicBaseUrl
      : `${this.config.publicBaseUrl}/`;

    return new URL(`${bucket}/${key}`, baseUrl).toString();
  }

  async getDownloadUrl(input: StorageObjectRef): Promise<SignedDownload> {
    const bucket = this.resolveBucket(input.bucket);
    const key = normalizeStorageKey(input.key);
    const publicUrl = this.getPublicUrl({ bucket, key });

    if (publicUrl) {
      return { url: publicUrl };
    }

    return {
      url: pathToFileURL(this.resolveObjectPath(bucket, key)).toString(),
    };
  }

  async getUploadUrl(
    input: StorageObjectRef & { contentType?: string },
    ttlSeconds = 15 * 60,
  ): Promise<SignedDownload> {
    const bucket = this.resolveBucket(input.bucket);
    const key = normalizeStorageKey(input.key);

    const publicUrl = this.getPublicUrl({ bucket, key });
    if (publicUrl) {
      return { url: publicUrl, expiresAt: new Date(Date.now() + ttlSeconds * 1000) };
    }

    // For local adapter, return a file:// URL pointing at the resolved path.
    // This is primarily useful for local tooling/tests; browser uploads will
    // not work against file:// URLs. For dev, prefer using the publicBaseUrl
    // or the server-side upload endpoint which calls putObject directly.
    return {
      url: pathToFileURL(this.resolveObjectPath(bucket, key)).toString(),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }

  async readObject(input: StorageObjectRef): Promise<ReadObjectResult> {
    const bucket = this.resolveBucket(input.bucket);
    const key = normalizeStorageKey(input.key);
    const filePath = this.resolveObjectPath(bucket, key);

    const body = await readFile(filePath);
    const ext = key.split('.').pop()?.toLowerCase();
    const contentType = MIME_MAP[ext ?? ''] ?? 'application/octet-stream';

    return { body, contentType };
  }

  private resolveBucket(bucket?: string): string {
    const value = bucket?.trim() || this.config.defaultBucket.trim();
    if (!value) {
      throw new Error('Storage bucket cannot be empty.');
    }

    return normalizeStorageSegment(value, 'bucket');
  }

  private resolveObjectPath(bucket: string, key: string): string {
    const absoluteRoot = resolve(this.config.local.rootPath);
    const relativePath = join(bucket, ...key.split('/'));
    const normalizedPath = normalize(join(absoluteRoot, relativePath));
    const rootPrefix = absoluteRoot.endsWith(sep) ? absoluteRoot : `${absoluteRoot}${sep}`;

    if (!normalizedPath.startsWith(rootPrefix)) {
      throw new Error('Resolved storage path escapes the configured local storage root.');
    }

    return normalizedPath;
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
  if (trimmed.startsWith('/') || isAbsolute(trimmed)) {
    throw new Error('Storage key must be relative to the configured storage root.');
  }

  const segments = trimmed.split('/').filter(Boolean);
  if (segments.length === 0) {
    throw new Error('Storage key cannot be empty.');
  }

  return segments.map((segment) => normalizeStorageSegment(segment, 'key segment')).join('/');
}

function normalizeStorageSegment(segment: string, label: string): string {
  if (!segment || segment === '.' || segment === '..') {
    throw new Error(`Invalid storage ${label}: ${segment || '(empty)'}.`);
  }

  if (segment.includes('/')) {
    throw new Error(`Storage ${label} cannot contain path separators.`);
  }

  return segment;
}

function encodeUrlSegment(value: string): string {
  return encodeURIComponent(value).replace(/%2F/gi, '/');
}
