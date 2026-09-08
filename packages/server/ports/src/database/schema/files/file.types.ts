import { FileScanStatus, FilePurpose, FileUploadStatus, FileVisibility, StorageProvider } from '@workspace/constants';
import { RepoQueryOptions } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// FileRecord Types — metadata pointer to an object in storage. The binary
// never lives here (R2/S3/local); only the pointer, checksum, scan status.
// ─────────────────────────────────────────────────────────────────────────────
export interface FileRecordPersistence {
  id: string;
  ownerProfileId: string | null;
  uploadedByUserId: string | null;
  storageProvider: StorageProvider;
  bucket: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string | null;
  visibility: FileVisibility;
  scanStatus: FileScanStatus;
  purpose: FilePurpose;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateFileRecordInput extends Omit<
  FileRecordPersistence,
  'id' | 'scanStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'
> {
  id?: string;
  scanStatus?: FileScanStatus;
}

export type UpdateFileRecordInput = Partial<
  Pick<FileRecordPersistence, 'scanStatus' | 'checksumSha256' | 'metadata' | 'visibility'>
>;

// ─────────────────────────────────────────────────────────────────────────────
// FileUpload Types — presigned-intent row, finalised into a FileRecord once
// the client's PUT completes.
// ─────────────────────────────────────────────────────────────────────────────
export interface FileUploadPersistence {
  id: string;
  profileId: string | null;
  userId: string | null;
  expectedMime: string;
  expectedBytes: number | null;
  bucket: string;
  objectKey: string;
  purpose: FilePurpose;
  status: FileUploadStatus;
  fileId: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFileUploadInput extends Omit<
  FileUploadPersistence,
  'id' | 'status' | 'fileId' | 'createdAt' | 'updatedAt'
> {
  id?: string;
  status?: FileUploadStatus;
}

export type UpdateFileUploadInput = Partial<
  Pick<FileUploadPersistence, 'status' | 'fileId'>
>;

// ─────────────────────────────────────────────────────────────────────────────
// Query Options
// ─────────────────────────────────────────────────────────────────────────────
export type FileRecordPersistenceQueryOptions<
  K extends keyof FileRecordPersistence = keyof FileRecordPersistence,
> = RepoQueryOptions<FileRecordPersistence, K>;

export type FileUploadPersistenceQueryOptions<
  K extends keyof FileUploadPersistence = keyof FileUploadPersistence,
> = RepoQueryOptions<FileUploadPersistence, K>;
