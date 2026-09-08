export type StorageObjectBody = string | Uint8Array;

export interface StorageObjectRef {
  bucket?: string;
  key: string;
}

export interface PutObjectInput extends StorageObjectRef {
  body: StorageObjectBody;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StoredObject {
  bucket: string;
  key: string;
  contentType?: string;
  size: number;
  url?: string | null;
}

export interface SignedDownload {
  url: string;
  expiresAt?: Date;
}

export interface ReadObjectResult {
  body: Uint8Array;
  contentType?: string;
}

export abstract class StoragePort {
  abstract putObject(input: PutObjectInput): Promise<StoredObject>;
  abstract deleteObject(input: StorageObjectRef): Promise<void>;
  abstract exists(input: StorageObjectRef): Promise<boolean>;
  abstract getPublicUrl(input: StorageObjectRef): string | null;
  abstract getDownloadUrl(input: StorageObjectRef): Promise<SignedDownload>;
  /** Presigned PUT URL for a client-driven upload. `ttlSeconds` defaults to
   * 15 minutes at each adapter. */
  abstract getUploadUrl(
    input: StorageObjectRef & { contentType?: string },
    ttlSeconds?: number,
  ): Promise<SignedDownload>;
  abstract readObject(input: StorageObjectRef): Promise<ReadObjectResult>;
}

export const STORAGE_PORT_TOKEN = Symbol('STORAGE_PORT_TOKEN');
