import type {
  StorageProvider,
  FileVisibility,
  FileScanStatus,
  FilePurpose,
  FileUploadStatus,
} from '@workspace/constants';
import type { FileRecordPersistence, FileUploadPersistence } from '@workspace/ports';
import type {
  FileRecord as PrismaFileRecord,
  FileUpload as PrismaFileUpload,
} from '@workspace/prisma/client';

// storageProvider/visibility/scanStatus/purpose/status are String columns
// with /// @check doc-comments (not native Prisma enums), so they need the
// same narrowing UserConverter does for auth.User.userType/status.
export const FilesConverter = {
  toFileRecordPersistence(row: PrismaFileRecord): FileRecordPersistence {
    return {
      ...row,
      storageProvider: row.storageProvider as StorageProvider,
      visibility: row.visibility as FileVisibility,
      scanStatus: row.scanStatus as FileScanStatus,
      purpose: row.purpose as FilePurpose,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    };
  },

  toFileRecordPartialPersistence(
    row: Partial<PrismaFileRecord>,
  ): Partial<FileRecordPersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('storageProvider' in row) result.storageProvider = row.storageProvider as StorageProvider;
    if ('visibility' in row) result.visibility = row.visibility as FileVisibility;
    if ('scanStatus' in row) result.scanStatus = row.scanStatus as FileScanStatus;
    if ('purpose' in row) result.purpose = row.purpose as FilePurpose;
    if ('metadata' in row) result.metadata = (row.metadata as Record<string, unknown> | null) ?? null;
    return result;
  },

  toFileUploadPersistence(row: PrismaFileUpload): FileUploadPersistence {
    return {
      ...row,
      purpose: row.purpose as FilePurpose,
      status: row.status as FileUploadStatus,
    };
  },

  toFileUploadPartialPersistence(
    row: Partial<PrismaFileUpload>,
  ): Partial<FileUploadPersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('purpose' in row) result.purpose = row.purpose as FilePurpose;
    if ('status' in row) result.status = row.status as FileUploadStatus;
    return result;
  },
};
