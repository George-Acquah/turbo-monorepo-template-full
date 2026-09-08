import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  ApiClientRepositoryPort,
  type ApiClientPersistence,
  type CreateApiClientInput,
  type UpdateApiClientInput,
  type ApiClientPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { IdentityConverter } from '../converter/identity.converter';
import { ApiClientQuery } from '../queries/api-client.query';

@Injectable()
export class PrismaApiClientAdapter implements ApiClientRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly apiClientQuery: ApiClientQuery,
  ) {}

  async create(data: CreateApiClientInput, tx?: DatabaseTx): Promise<ApiClientPersistence> {
    const { id, metadata, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).apiClient.create({
      data: { id: id ?? generateId(IdPrefixes.API_CLIENT), ...rest, metadata: metadata ?? undefined },
    });
    return IdentityConverter.toApiClientPersistence(row);
  }

  async update(
    id: string,
    data: UpdateApiClientInput,
    tx?: DatabaseTx,
  ): Promise<ApiClientPersistence> {
    const { metadata, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).apiClient.update({
      where: { id },
      data: { ...rest, metadata: metadata ?? undefined },
    });
    return IdentityConverter.toApiClientPersistence(row);
  }

  async softDelete(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).apiClient.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'REVOKED' },
    });
  }

  //Reads

  async findById<K extends keyof ApiClientPersistence = keyof ApiClientPersistence>(
    id: string,
    options?: ApiClientPersistenceQueryOptions<K>,
  ): Promise<Pick<ApiClientPersistence, K> | null> {
    const row = await this.apiClientQuery.findById(id, options);
    return row
      ? (IdentityConverter.toApiClientPartialPersistence(row) as Pick<ApiClientPersistence, K>)
      : null;
  }

  async findByClientId<K extends keyof ApiClientPersistence = keyof ApiClientPersistence>(
    clientId: string,
    options?: ApiClientPersistenceQueryOptions<K>,
  ): Promise<Pick<ApiClientPersistence, K> | null> {
    const row = await this.apiClientQuery.findByClientId(clientId, options);
    return row
      ? (IdentityConverter.toApiClientPartialPersistence(row) as Pick<ApiClientPersistence, K>)
      : null;
  }

  async findMany<K extends keyof ApiClientPersistence = keyof ApiClientPersistence>(
    options?: ApiClientPersistenceQueryOptions<K>,
  ): Promise<Pick<ApiClientPersistence, K>[]> {
    const rows = await this.apiClientQuery.findMany(options);
    return rows.map(
      (row) => IdentityConverter.toApiClientPartialPersistence(row) as Pick<ApiClientPersistence, K>,
    );
  }
}
