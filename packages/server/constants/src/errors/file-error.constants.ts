export const FileErrorCodes = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  FILE_SIZE_LIMIT_EXCEEDED: 'FILE_SIZE_LIMIT_EXCEEDED',
  FILE_ACCESS_DENIED: 'FILE_ACCESS_DENIED',
} as const;

export type FileErrorCode = (typeof FileErrorCodes)[keyof typeof FileErrorCodes];
