import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  FileUploadRepositoryPort,
  type FileUploadPersistence,
  type CreateFileUploadInput,
  type UpdateFileUploadInput,
  type FileUploadPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { FilesConverter } from '../converter/files.converter';
import { FileUploadQuery } from '../queries/file-upload.query';

@Injectable()
export class PrismaFileUploadAdapter implements FileUploadRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly fileUploadQuery: FileUploadQuery,
  ) {}

  async create(data: CreateFileUploadInput, tx?: DatabaseTx): Promise<FileUploadPersistence> {
    const { id, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).fileUpload.create({
      data: { id: id ?? generateId(IdPrefixes.FILE_UPLOAD), ...rest },
    });
    return FilesConverter.toFileUploadPersistence(row);
  }

  async update(
    id: string,
    data: UpdateFileUploadInput,
    tx?: DatabaseTx,
  ): Promise<FileUploadPersistence> {
    const row = await resolvePrismaClient(tx, this.prisma).fileUpload.update({
      where: { id },
      data,
    });
    return FilesConverter.toFileUploadPersistence(row);
  }

  async markConsumed(
    id: string,
    fileId: string,
    tx?: DatabaseTx,
  ): Promise<FileUploadPersistence> {
    const row = await resolvePrismaClient(tx, this.prisma).fileUpload.update({
      where: { id },
      data: { status: 'CONSUMED', fileId },
    });
    return FilesConverter.toFileUploadPersistence(row);
  }

  //Reads

  async findById<K extends keyof FileUploadPersistence = keyof FileUploadPersistence>(
    id: string,
    options?: FileUploadPersistenceQueryOptions<K>,
  ): Promise<Pick<FileUploadPersistence, K> | null> {
    const row = await this.fileUploadQuery.findById(id, options);
    return row
      ? (FilesConverter.toFileUploadPartialPersistence(row) as Pick<FileUploadPersistence, K>)
      : null;
  }

  async findExpired<K extends keyof FileUploadPersistence = keyof FileUploadPersistence>(
    before: Date,
    options?: FileUploadPersistenceQueryOptions<K>,
  ): Promise<Pick<FileUploadPersistence, K>[]> {
    const rows = await this.fileUploadQuery.findExpired(before, options);
    return rows.map(
      (row) => FilesConverter.toFileUploadPartialPersistence(row) as Pick<FileUploadPersistence, K>,
    );
  }
}
