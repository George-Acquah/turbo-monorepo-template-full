import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  FileRecordRepositoryPort,
  type FileRecordPersistence,
  type CreateFileRecordInput,
  type UpdateFileRecordInput,
  type FileRecordPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { FilesConverter } from '../converter/files.converter';
import { FileRecordQuery } from '../queries/file-record.query';

@Injectable()
export class PrismaFileRecordAdapter implements FileRecordRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly fileRecordQuery: FileRecordQuery,
  ) {}

  async create(data: CreateFileRecordInput, tx?: DatabaseTx): Promise<FileRecordPersistence> {
    const { id, metadata, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).fileRecord.create({
      data: { id: id ?? generateId(IdPrefixes.FILE), ...rest, metadata: metadata ?? undefined },
    });
    return FilesConverter.toFileRecordPersistence(row);
  }

  async update(
    id: string,
    data: UpdateFileRecordInput,
    tx?: DatabaseTx,
  ): Promise<FileRecordPersistence> {
    const { metadata, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).fileRecord.update({
      where: { id },
      data: { ...rest, metadata: metadata ?? undefined },
    });
    return FilesConverter.toFileRecordPersistence(row);
  }

  async softDelete(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).fileRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  //Reads

  async findById<K extends keyof FileRecordPersistence = keyof FileRecordPersistence>(
    id: string,
    options?: FileRecordPersistenceQueryOptions<K>,
  ): Promise<Pick<FileRecordPersistence, K> | null> {
    const row = await this.fileRecordQuery.findById(id, options);
    return row
      ? (FilesConverter.toFileRecordPartialPersistence(row) as Pick<FileRecordPersistence, K>)
      : null;
  }

  async findByObjectKey<K extends keyof FileRecordPersistence = keyof FileRecordPersistence>(
    bucket: string,
    objectKey: string,
    options?: FileRecordPersistenceQueryOptions<K>,
  ): Promise<Pick<FileRecordPersistence, K> | null> {
    const row = await this.fileRecordQuery.findByObjectKey(bucket, objectKey, options);
    return row
      ? (FilesConverter.toFileRecordPartialPersistence(row) as Pick<FileRecordPersistence, K>)
      : null;
  }

  async findByOwnerProfile<K extends keyof FileRecordPersistence = keyof FileRecordPersistence>(
    ownerProfileId: string,
    options?: FileRecordPersistenceQueryOptions<K>,
  ): Promise<Pick<FileRecordPersistence, K>[]> {
    const rows = await this.fileRecordQuery.findByOwnerProfile(ownerProfileId, options);
    return rows.map(
      (row) => FilesConverter.toFileRecordPartialPersistence(row) as Pick<FileRecordPersistence, K>,
    );
  }
}
