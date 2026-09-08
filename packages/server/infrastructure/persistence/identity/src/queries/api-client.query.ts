import { Inject, Injectable } from '@nestjs/common';
import type { ApiClientPersistence, ApiClientPersistenceQueryOptions } from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { ApiClient as PrismaApiClientModel } from '@workspace/prisma/client';

type ApiClientRow = Partial<PrismaApiClientModel>;

@Injectable()
export class ApiClientQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof ApiClientPersistence = keyof ApiClientPersistence>(
    id: string,
    options?: ApiClientPersistenceQueryOptions<K>,
  ): Promise<ApiClientRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).apiClient.findUnique({
      where: { id },
      select: buildPrismaSelect<ApiClientPersistence, K>(options?.select),
    });
  }

  findByClientId<K extends keyof ApiClientPersistence = keyof ApiClientPersistence>(
    clientId: string,
    options?: ApiClientPersistenceQueryOptions<K>,
  ): Promise<ApiClientRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).apiClient.findUnique({
      where: { clientId },
      select: buildPrismaSelect<ApiClientPersistence, K>(options?.select),
    });
  }

  findMany<K extends keyof ApiClientPersistence = keyof ApiClientPersistence>(
    options?: ApiClientPersistenceQueryOptions<K>,
  ): Promise<ApiClientRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).apiClient.findMany({
      where: { deletedAt: null },
      select: buildPrismaSelect<ApiClientPersistence, K>(options?.select),
    });
  }
}
