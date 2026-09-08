import type { DatabaseTx } from '../shared';
import {
  CreateFileRecordInput,
  UpdateFileRecordInput,
  FileRecordPersistence,
  FileRecordPersistenceQueryOptions,
} from './file.types';

export abstract class FileRecordRepositoryPort {
  abstract create(
    data: CreateFileRecordInput,
    tx?: DatabaseTx,
  ): Promise<FileRecordPersistence>;

  abstract update(
    id: string,
    data: UpdateFileRecordInput,
    tx?: DatabaseTx,
  ): Promise<FileRecordPersistence>;

  abstract softDelete(id: string, tx?: DatabaseTx): Promise<void>;

  //Reads

  abstract findById<K extends keyof FileRecordPersistence = keyof FileRecordPersistence>(
    id: string,
    options?: FileRecordPersistenceQueryOptions<K>,
  ): Promise<Pick<FileRecordPersistence, K> | null>;

  abstract findByObjectKey<K extends keyof FileRecordPersistence = keyof FileRecordPersistence>(
    bucket: string,
    objectKey: string,
    options?: FileRecordPersistenceQueryOptions<K>,
  ): Promise<Pick<FileRecordPersistence, K> | null>;

  abstract findByOwnerProfile<
    K extends keyof FileRecordPersistence = keyof FileRecordPersistence,
  >(
    ownerProfileId: string,
    options?: FileRecordPersistenceQueryOptions<K>,
  ): Promise<Pick<FileRecordPersistence, K>[]>;
}

export const FILE_RECORD_REPOSITORY_TOKEN = Symbol('FILE_RECORD_REPOSITORY_TOKEN');
export const PRISMA_FILE_RECORD_REPOSITORY_TOKEN = Symbol('PRISMA_FILE_RECORD_REPOSITORY_TOKEN');
