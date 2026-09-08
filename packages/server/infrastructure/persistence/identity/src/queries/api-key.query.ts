import { Inject, Injectable } from '@nestjs/common';
import type { ApiKeyPersistence, ApiKeyPersistenceQueryOptions } from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { ApiKey as PrismaApiKeyModel } from '@workspace/prisma/client';

type ApiKeyRow = Partial<PrismaApiKeyModel>;

@Injectable()
export class ApiKeyQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof ApiKeyPersistence = keyof ApiKeyPersistence>(
    id: string,
    options?: ApiKeyPersistenceQueryOptions<K>,
  ): Promise<ApiKeyRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).apiKey.findUnique({
      where: { id },
      select: buildPrismaSelect<ApiKeyPersistence, K>(options?.select),
    });
  }

  findByKeyHash<K extends keyof ApiKeyPersistence = keyof ApiKeyPersistence>(
    keyHash: string,
    options?: ApiKeyPersistenceQueryOptions<K>,
  ): Promise<ApiKeyRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).apiKey.findUnique({
      where: { keyHash },
      select: buildPrismaSelect<ApiKeyPersistence, K>(options?.select),
    });
  }

  findClientKeys<K extends keyof ApiKeyPersistence = keyof ApiKeyPersistence>(
    apiClientId: string,
    options?: ApiKeyPersistenceQueryOptions<K>,
  ): Promise<ApiKeyRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).apiKey.findMany({
      where: { apiClientId },
      select: buildPrismaSelect<ApiKeyPersistence, K>(options?.select),
    });
  }
}
