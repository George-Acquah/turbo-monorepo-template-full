import { Inject, Injectable } from '@nestjs/common';
import type { FileRecordPersistence, FileRecordPersistenceQueryOptions } from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { FileRecord as PrismaFileRecordModel } from '@workspace/prisma/client';

type FileRecordRow = Partial<PrismaFileRecordModel>;

@Injectable()
export class FileRecordQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof FileRecordPersistence = keyof FileRecordPersistence>(
    id: string,
    options?: FileRecordPersistenceQueryOptions<K>,
  ): Promise<FileRecordRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).fileRecord.findUnique({
      where: { id },
      select: buildPrismaSelect<FileRecordPersistence, K>(options?.select),
    });
  }

  findByObjectKey<K extends keyof FileRecordPersistence = keyof FileRecordPersistence>(
    bucket: string,
    objectKey: string,
    options?: FileRecordPersistenceQueryOptions<K>,
  ): Promise<FileRecordRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).fileRecord.findUnique({
      where: { bucket_objectKey: { bucket, objectKey } },
      select: buildPrismaSelect<FileRecordPersistence, K>(options?.select),
    });
  }

  findByOwnerProfile<K extends keyof FileRecordPersistence = keyof FileRecordPersistence>(
    ownerProfileId: string,
    options?: FileRecordPersistenceQueryOptions<K>,
  ): Promise<FileRecordRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).fileRecord.findMany({
      where: { ownerProfileId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: buildPrismaSelect<FileRecordPersistence, K>(options?.select),
    });
  }
}
