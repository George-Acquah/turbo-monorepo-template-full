import {
  type CreateFileUploadInput,
  CONTEXT_TOKEN,
  type ContextPort,
  type DatabaseTx,
  type FileUploadRecord,
  FileUploadStorePort,
} from '@repo/ports';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma.service';
import { generateId } from '../../utils/generate-id';
import { resolvePrismaClient } from '../../utils/prisma-client-resolver';
import { toInputJson, toRecord } from '../../utils/prisma-mappers';

@Injectable()
export class PrismaFileUploadStoreAdapter implements FileUploadStorePort {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CONTEXT_TOKEN) private readonly context?: ContextPort,
  ) {}

  async create(data: CreateFileUploadInput, tx?: DatabaseTx): Promise<FileUploadRecord> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).fileUpload.create({
      data: {
        id: generateId('fup'),
        bucket: data.bucket,
        key: data.key,
        fileName: data.fileName,
        mimeType: data.mimeType,
        size: data.size ?? null,
        signedUrl: data.signedUrl,
        expiresAt: data.expiresAt,
        uploadedById: data.uploadedById ?? null,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        metadata: toInputJson(data.metadata),
      },
    });

    return this.mapUpload(row);
  }

  async findById(id: string): Promise<FileUploadRecord | null> {
    const row = await resolvePrismaClient(this.prisma, this.context).fileUpload.findUnique({
      where: { id },
    });

    return row ? this.mapUpload(row) : null;
  }

  async findPendingByKey(bucket: string, key: string): Promise<FileUploadRecord | null> {
    const row = await resolvePrismaClient(this.prisma, this.context).fileUpload.findFirst({
      where: {
        bucket: bucket as never,
        key,
        isCompleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return row ? this.mapUpload(row) : null;
  }

  async markCompleted(
    id: string,
    data: { fileId: string; completedAt?: Date },
    tx?: DatabaseTx,
  ): Promise<FileUploadRecord> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).fileUpload.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: data.completedAt ?? new Date(),
        fileId: data.fileId,
      },
    });

    return this.mapUpload(row);
  }

  private mapUpload(row: Prisma.FileUploadGetPayload<Record<string, never>>): FileUploadRecord {
    return {
      id: row.id,
      bucket: row.bucket,
      key: row.key,
      fileName: row.fileName,
      mimeType: row.mimeType,
      size: row.size,
      signedUrl: row.signedUrl,
      expiresAt: row.expiresAt,
      isCompleted: row.isCompleted,
      completedAt: row.completedAt,
      fileId: row.fileId,
      uploadedById: row.uploadedById,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: toRecord(row.metadata) ?? null,
      createdAt: row.createdAt,
    };
  }
}
