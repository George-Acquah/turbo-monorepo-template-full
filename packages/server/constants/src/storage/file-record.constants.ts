// workspace_files — FileRecord / FileUpload enum values (single source for the
// /// @check constraints in files.prisma). Storage provider values reuse
// ../storage/storage-provider.constants.ts (StorageProviders); visibility reuses
// file-visibility.constants.ts (FileVisibility).

export const FileScanStatus = {
  PENDING: 'PENDING',
  CLEAN: 'CLEAN',
  INFECTED: 'INFECTED',
  SKIPPED: 'SKIPPED',
} as const;

export type FileScanStatus = (typeof FileScanStatus)[keyof typeof FileScanStatus];

export const FilePurpose = {
  LESSON_VIDEO: 'LESSON_VIDEO',
  REPLAY_VIDEO: 'REPLAY_VIDEO',
  RESOURCE: 'RESOURCE',
  RECEIPT_PDF: 'RECEIPT_PDF',
  AVATAR: 'AVATAR',
  OTHER: 'OTHER',
} as const;

export type FilePurpose = (typeof FilePurpose)[keyof typeof FilePurpose];

export const FileUploadStatus = {
  PENDING: 'PENDING',
  UPLOADED: 'UPLOADED',
  CONSUMED: 'CONSUMED',
  EXPIRED: 'EXPIRED',
  ABORTED: 'ABORTED',
} as const;

export type FileUploadStatus = (typeof FileUploadStatus)[keyof typeof FileUploadStatus];
