import type { DatabaseTx } from '../shared';
import {
  CreateFileUploadInput,
  UpdateFileUploadInput,
  FileUploadPersistence,
  FileUploadPersistenceQueryOptions,
} from './file.types';

export abstract class FileUploadRepositoryPort {
  abstract create(
    data: CreateFileUploadInput,
    tx?: DatabaseTx,
  ): Promise<FileUploadPersistence>;

  abstract update(
    id: string,
    data: UpdateFileUploadInput,
    tx?: DatabaseTx,
  ): Promise<FileUploadPersistence>;

  /**
   * Finalises the intent once the client's PUT completes and a FileRecord
   * has been created.
   */
  abstract markConsumed(
    id: string,
    fileId: string,
    tx?: DatabaseTx,
  ): Promise<FileUploadPersistence>;

  //Reads

  abstract findById<K extends keyof FileUploadPersistence = keyof FileUploadPersistence>(
    id: string,
    options?: FileUploadPersistenceQueryOptions<K>,
  ): Promise<Pick<FileUploadPersistence, K> | null>;

  /**
   * Pending, not-yet-expired upload intents — sweep target for expiry.
   */
  abstract findExpired<K extends keyof FileUploadPersistence = keyof FileUploadPersistence>(
    before: Date,
    options?: FileUploadPersistenceQueryOptions<K>,
  ): Promise<Pick<FileUploadPersistence, K>[]>;
}

export const FILE_UPLOAD_REPOSITORY_TOKEN = Symbol('FILE_UPLOAD_REPOSITORY_TOKEN');
export const PRISMA_FILE_UPLOAD_REPOSITORY_TOKEN = Symbol('PRISMA_FILE_UPLOAD_REPOSITORY_TOKEN');
