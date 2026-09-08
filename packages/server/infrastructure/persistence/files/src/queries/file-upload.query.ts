import { Inject, Injectable } from '@nestjs/common';
import type { FileUploadPersistence, FileUploadPersistenceQueryOptions } from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { FileUpload as PrismaFileUploadModel } from '@workspace/prisma/client';

type FileUploadRow = Partial<PrismaFileUploadModel>;

@Injectable()
export class FileUploadQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof FileUploadPersistence = keyof FileUploadPersistence>(
    id: string,
    options?: FileUploadPersistenceQueryOptions<K>,
  ): Promise<FileUploadRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).fileUpload.findUnique({
      where: { id },
      select: buildPrismaSelect<FileUploadPersistence, K>(options?.select),
    });
  }

  findExpired<K extends keyof FileUploadPersistence = keyof FileUploadPersistence>(
    before: Date,
    options?: FileUploadPersistenceQueryOptions<K>,
  ): Promise<FileUploadRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).fileUpload.findMany({
      where: { status: 'PENDING', expiresAt: { lt: before } },
      select: buildPrismaSelect<FileUploadPersistence, K>(options?.select),
    });
  }
}
