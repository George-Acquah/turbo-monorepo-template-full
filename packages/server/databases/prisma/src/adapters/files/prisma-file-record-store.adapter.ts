import { IdPrefixes } from '@repo/constants';
import {
  type CreateFileRecordInput,
  type FileRecord,
  FileRecordStorePort,
  CONTEXT_TOKEN,
  type ContextPort,
  type DatabaseTx,
} from '@repo/ports';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma.service';
import { generateId } from '../../utils/generate-id';
import { resolvePrismaClient } from '../../utils/prisma-client-resolver';
import { toInputJson, toRecord } from '../../utils/prisma-mappers';

@Injectable()
export class PrismaFileRecordStoreAdapter implements FileRecordStorePort {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CONTEXT_TOKEN) private readonly context?: ContextPort,
  ) {}

  async create(data: CreateFileRecordInput, tx?: DatabaseTx): Promise<FileRecord> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).file.create({
      data: {
        id: generateId(IdPrefixes.FILE),
        bucket: data.bucket,
        key: data.key,
        url: data.url,
        cdnUrl: data.cdnUrl ?? null,
        fileName: data.fileName,
        fileType: data.fileType,
        mimeType: data.mimeType,
        size: data.size,
        visibility: data.visibility ?? 'PUBLIC',
        width: data.width ?? null,
        height: data.height ?? null,
        blurhash: data.blurhash ?? null,
        uploadedById: data.uploadedById ?? null,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        sortOrder: data.sortOrder ?? 0,
        alt: data.alt ?? null,
        caption: data.caption ?? null,
        metadata: toInputJson(data.metadata),
      },
    });

    return this.mapFile(row);
  }

  async findById(id: string): Promise<FileRecord | null> {
    const row = await resolvePrismaClient(this.prisma, this.context).file.findFirst({
      where: { id, deletedAt: null },
    });

    return row ? this.mapFile(row) : null;
  }

  async findByStorageKey(bucket: string, key: string): Promise<FileRecord | null> {
    const row = await resolvePrismaClient(this.prisma, this.context).file.findFirst({
      where: {
        bucket: bucket as never,
        key,
        deletedAt: null,
      },
    });

    return row ? this.mapFile(row) : null;
  }

  async listByEntity(entityType: string, entityId: string): Promise<FileRecord[]> {
    const rows = await resolvePrismaClient(this.prisma, this.context).file.findMany({
      where: {
        entityType,
        entityId,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return rows.map((row) => this.mapFile(row));
  }

  async markProcessed(
    id: string,
    data?: {
      url?: string;
      cdnUrl?: string | null;
      blurhash?: string | null;
      width?: number | null;
      height?: number | null;
    },
    tx?: DatabaseTx,
  ): Promise<FileRecord> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).file.update({
      where: { id },
      data: {
        url: data?.url,
        cdnUrl: data?.cdnUrl,
        blurhash: data?.blurhash,
        width: data?.width,
        height: data?.height,
        isProcessed: true,
        processedAt: new Date(),
      },
    });

    return this.mapFile(row);
  }

  async softDelete(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(this.prisma, this.context, tx).file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private mapFile(row: Prisma.FileGetPayload<Record<string, never>>): FileRecord {
    return {
      id: row.id,
      bucket: row.bucket,
      key: row.key,
      url: row.url,
      cdnUrl: row.cdnUrl,
      fileName: row.fileName,
      fileType: row.fileType,
      mimeType: row.mimeType,
      size: row.size,
      visibility: row.visibility,
      width: row.width,
      height: row.height,
      blurhash: row.blurhash,
      uploadedById: row.uploadedById,
      entityType: row.entityType,
      entityId: row.entityId,
      sortOrder: row.sortOrder,
      alt: row.alt,
      caption: row.caption,
      metadata: toRecord(row.metadata) ?? null,
      isProcessed: row.isProcessed,
      processedAt: row.processedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
