export const FileVisibility = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  SIGNED: 'SIGNED',
} as const;

export type FileVisibility = (typeof FileVisibility)[keyof typeof FileVisibility];

export const FileBucket = {
  SCHOOL_LOGOS: 'SCHOOL_LOGOS',
  RECEIPTS: 'RECEIPTS',
  IMPORT_FILES: 'IMPORT_FILES',
  STUDENT_PHOTOS: 'STUDENT_PHOTOS',
  STAFF_DOCS: 'STAFF_DOCS',
  INVOICES: 'INVOICES',
  CURRICULUM_ASSETS: 'CURRICULUM_ASSETS',
  REPORTS: 'REPORTS',
  GENERAL: 'GENERAL',
} as const;

export type FileBucket = (typeof FileBucket)[keyof typeof FileBucket];

export const FileType = {
  IMAGE: 'IMAGE',
  DOCUMENT: 'DOCUMENT',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  OTHER: 'OTHER',
} as const;

export type FileType = (typeof FileType)[keyof typeof FileType];

export const FileProcessingStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  RETRYING: 'RETRYING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
} as const;

export type FileProcessingStatus = (typeof FileProcessingStatus)[keyof typeof FileProcessingStatus];
