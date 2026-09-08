import type { FilePurpose } from '@workspace/constants';

export interface CreateUploadIntentUseCaseInput {
  purpose: FilePurpose;
  mimeType: string;
  sizeBytes: number;
  /** Member-facing uploads set this; admin/staff-facing uploads set `userId` instead. */
  profileId?: string;
  userId?: string;
}

export interface CreateUploadIntentResult {
  uploadId: string;
  presignedUrl: string;
  expiresAt: Date;
}

export interface CompleteUploadUseCaseInput {
  uploadId: string;
  /** The caller completing the upload — must match the intent's owner. */
  profileId?: string;
  userId?: string;
}

export interface CompleteUploadResult {
  fileId: string;
}
