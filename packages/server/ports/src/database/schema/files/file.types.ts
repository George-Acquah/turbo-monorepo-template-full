export type FileType = 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'OTHER';
export type FileBucket =
  | 'PRODUCT_IMAGES'
  | 'COLLECTION_ASSETS'
  | 'REVIEW_IMAGES'
  | 'USER_AVATARS'
  | 'INVOICES'
  | 'RECEIPTS'
  | 'GENERAL';
export type FileVisibility = 'PUBLIC' | 'PRIVATE' | 'SIGNED';

export interface FileRecord {
  id: string;
  bucket: FileBucket;
  key: string;
  url: string;
  cdnUrl?: string | null;
  fileName: string;
  fileType: FileType;
  mimeType: string;
  size: number;
  visibility: FileVisibility;
  width?: number | null;
  height?: number | null;
  blurhash?: string | null;
  uploadedById?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  sortOrder: number;
  alt?: string | null;
  caption?: string | null;
  metadata?: Record<string, unknown> | null;
  isProcessed: boolean;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateFileRecordInput {
  bucket: FileBucket;
  key: string;
  url: string;
  cdnUrl?: string | null;
  fileName: string;
  fileType: FileType;
  mimeType: string;
  size: number;
  visibility?: FileVisibility;
  width?: number | null;
  height?: number | null;
  blurhash?: string | null;
  uploadedById?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  sortOrder?: number;
  alt?: string | null;
  caption?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface FileUploadRecord {
  id: string;
  bucket: FileBucket;
  key: string;
  fileName: string;
  mimeType: string;
  size?: number | null;
  signedUrl: string;
  expiresAt: Date;
  isCompleted: boolean;
  completedAt?: Date | null;
  fileId?: string | null;
  uploadedById?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateFileUploadInput {
  bucket: FileBucket;
  key: string;
  fileName: string;
  mimeType: string;
  signedUrl: string;
  expiresAt: Date;
  size?: number | null;
  uploadedById?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}
