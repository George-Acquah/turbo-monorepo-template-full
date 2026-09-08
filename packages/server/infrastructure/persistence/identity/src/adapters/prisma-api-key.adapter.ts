import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  ApiKeyRepositoryPort,
  type ApiKeyPersistence,
  type CreateApiKeyInput,
  type ApiKeyPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { IdentityConverter } from '../converter/identity.converter';
import { ApiKeyQuery } from '../queries/api-key.query';

@Injectable()
export class PrismaApiKeyAdapter implements ApiKeyRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly apiKeyQuery: ApiKeyQuery,
  ) {}

  async create(data: CreateApiKeyInput, tx?: DatabaseTx): Promise<ApiKeyPersistence> {
    const { id, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).apiKey.create({
      data: { id: id ?? generateId(IdPrefixes.API_KEY), ...rest },
    });
    return IdentityConverter.toApiKeyPersistence(row);
  }

  async revoke(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).apiKey.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
  }

  async updateLastUsed(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  //Reads

  async findById<K extends keyof ApiKeyPersistence = keyof ApiKeyPersistence>(
    id: string,
    options?: ApiKeyPersistenceQueryOptions<K>,
  ): Promise<Pick<ApiKeyPersistence, K> | null> {
    const row = await this.apiKeyQuery.findById(id, options);
    return row
      ? (IdentityConverter.toApiKeyPartialPersistence(row) as Pick<ApiKeyPersistence, K>)
      : null;
  }

  async findByKeyHash<K extends keyof ApiKeyPersistence = keyof ApiKeyPersistence>(
    keyHash: string,
    options?: ApiKeyPersistenceQueryOptions<K>,
  ): Promise<Pick<ApiKeyPersistence, K> | null> {
    const row = await this.apiKeyQuery.findByKeyHash(keyHash, options);
    return row
      ? (IdentityConverter.toApiKeyPartialPersistence(row) as Pick<ApiKeyPersistence, K>)
      : null;
  }

  async findClientKeys<K extends keyof ApiKeyPersistence = keyof ApiKeyPersistence>(
    apiClientId: string,
    options?: ApiKeyPersistenceQueryOptions<K>,
  ): Promise<Pick<ApiKeyPersistence, K>[]> {
    const rows = await this.apiKeyQuery.findClientKeys(apiClientId, options);
    return rows.map(
      (row) => IdentityConverter.toApiKeyPartialPersistence(row) as Pick<ApiKeyPersistence, K>,
    );
  }
}
