import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  PermissionRepositoryPort,
  type PermissionPersistence,
  type CreatePermissionInput,
  type UpdatePermissionInput,
  type PermissionPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { PermissionQuery } from '../queries/permission.query';

@Injectable()
export class PrismaPermissionAdapter implements PermissionRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly permissionQuery: PermissionQuery,
  ) {}

  async create(data: CreatePermissionInput, tx?: DatabaseTx): Promise<PermissionPersistence> {
    const { id, ...rest } = data;
    return resolvePrismaClient(tx, this.prisma).permission.create({
      data: { id: id ?? generateId(IdPrefixes.PERMISSION), ...rest },
    });
  }

  async update(
    id: string,
    data: UpdatePermissionInput,
    tx?: DatabaseTx,
  ): Promise<PermissionPersistence> {
    return resolvePrismaClient(tx, this.prisma).permission.update({ where: { id }, data });
  }

  async upsertMany(permissions: CreatePermissionInput[], tx?: DatabaseTx): Promise<void> {
    const client = resolvePrismaClient(tx, this.prisma);
    await Promise.all(
      permissions.map(({ id, ...rest }) =>
        client.permission.upsert({
          where: { key: rest.key },
          create: { id: id ?? generateId(IdPrefixes.PERMISSION), ...rest },
          update: rest,
        }),
      ),
    );
  }

  //Reads

  async findById<K extends keyof PermissionPersistence = keyof PermissionPersistence>(
    id: string,
    options?: PermissionPersistenceQueryOptions<K>,
  ): Promise<Pick<PermissionPersistence, K> | null> {
    return (await this.permissionQuery.findById(id, options)) as Pick<
      PermissionPersistence,
      K
    > | null;
  }

  async findByKey<K extends keyof PermissionPersistence = keyof PermissionPersistence>(
    key: string,
    options?: PermissionPersistenceQueryOptions<K>,
  ): Promise<Pick<PermissionPersistence, K> | null> {
    return (await this.permissionQuery.findByKey(key, options)) as Pick<
      PermissionPersistence,
      K
    > | null;
  }

  async findMany<K extends keyof PermissionPersistence = keyof PermissionPersistence>(
    params: { resource?: string; isActive?: boolean },
    options?: PermissionPersistenceQueryOptions<K>,
    tx?: DatabaseTx,
  ): Promise<Pick<PermissionPersistence, K>[]> {
    return (await this.permissionQuery.findMany(params, options, tx)) as Pick<
      PermissionPersistence,
      K
    >[];
  }
}
