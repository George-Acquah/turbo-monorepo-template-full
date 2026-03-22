import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, normalize, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
  PutObjectInput,
  SignedDownload,
  StoredObject,
  StorageObjectBody,
  StorageObjectRef,
  StoragePort,
} from '@repo/ports';
import type { StorageRuntimeConfig } from '@repo/config';

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
    const key = normalizeStorageKey(input.key)
      .split('/')
      .map(encodeUrlSegment)
      .join('/');

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
