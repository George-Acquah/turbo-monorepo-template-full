import type { DatabaseTx } from '../shared';
import { CreateFileUploadInput, FileUploadRecord } from './file.types';

export abstract class FileUploadStorePort {
  abstract create(data: CreateFileUploadInput, tx?: DatabaseTx): Promise<FileUploadRecord>;
  abstract findById(id: string): Promise<FileUploadRecord | null>;
  abstract findPendingByKey(bucket: string, key: string): Promise<FileUploadRecord | null>;
  abstract markCompleted(
    id: string,
    data: { fileId: string; completedAt?: Date },
    tx?: DatabaseTx,
  ): Promise<FileUploadRecord>;
}

export const FILE_UPLOAD_STORE_TOKEN = Symbol('FILE_UPLOAD_STORE_TOKEN');
