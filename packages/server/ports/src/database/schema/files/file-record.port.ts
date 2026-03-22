import type { DatabaseTx } from '../shared';
import { CreateFileRecordInput, FileRecord } from './file.types';

export abstract class FileRecordStorePort {
  abstract create(data: CreateFileRecordInput, tx?: DatabaseTx): Promise<FileRecord>;
  abstract findById(id: string): Promise<FileRecord | null>;
  abstract findByStorageKey(bucket: string, key: string): Promise<FileRecord | null>;
  abstract listByEntity(entityType: string, entityId: string): Promise<FileRecord[]>;
  abstract markProcessed(
    id: string,
    data?: {
      url?: string;
      cdnUrl?: string | null;
      blurhash?: string | null;
      width?: number | null;
      height?: number | null;
    },
    tx?: DatabaseTx,
  ): Promise<FileRecord>;
  abstract softDelete(id: string, tx?: DatabaseTx): Promise<void>;
}

export const FILE_RECORD_STORE_TOKEN = Symbol('FILE_RECORD_STORE_TOKEN');
