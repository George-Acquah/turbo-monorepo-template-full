import type { Provider } from '@nestjs/common';
import {
  FILE_RECORD_REPOSITORY_TOKEN,
  PRISMA_FILE_RECORD_REPOSITORY_TOKEN,
  FILE_UPLOAD_REPOSITORY_TOKEN,
  PRISMA_FILE_UPLOAD_REPOSITORY_TOKEN,
} from '@workspace/ports';
import { PrismaFileRecordAdapter, PrismaFileUploadAdapter } from '../adapters';

export const FILES_PERSISTENCE_ADAPTERS: Provider[] = [
  PrismaFileRecordAdapter,
  { provide: PRISMA_FILE_RECORD_REPOSITORY_TOKEN, useExisting: PrismaFileRecordAdapter },
  { provide: FILE_RECORD_REPOSITORY_TOKEN, useExisting: PrismaFileRecordAdapter },

  PrismaFileUploadAdapter,
  { provide: PRISMA_FILE_UPLOAD_REPOSITORY_TOKEN, useExisting: PrismaFileUploadAdapter },
  { provide: FILE_UPLOAD_REPOSITORY_TOKEN, useExisting: PrismaFileUploadAdapter },
];

export const FILES_PERSISTENCE_TOKENS = [FILE_RECORD_REPOSITORY_TOKEN, FILE_UPLOAD_REPOSITORY_TOKEN];
