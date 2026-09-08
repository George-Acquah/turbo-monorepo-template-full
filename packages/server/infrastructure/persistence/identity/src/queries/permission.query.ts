import { Inject, Injectable } from '@nestjs/common';
import type { PermissionPersistence, PermissionPersistenceQueryOptions } from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { Permission as PrismaPermissionModel } from '@workspace/prisma/client';
import type { DatabaseTx } from '@workspace/ports';

type PermissionRow = Partial<PrismaPermissionModel>;

@Injectable()
export class PermissionQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof PermissionPersistence = keyof PermissionPersistence>(
    id: string,
    options?: PermissionPersistenceQueryOptions<K>,
  ): Promise<PermissionRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).permission.findUnique({
      where: { id },
      select: buildPrismaSelect<PermissionPersistence, K>(options?.select),
    });
  }

  findByKey<K extends keyof PermissionPersistence = keyof PermissionPersistence>(
    key: string,
    options?: PermissionPersistenceQueryOptions<K>,
  ): Promise<PermissionRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).permission.findUnique({
      where: { key },
      select: buildPrismaSelect<PermissionPersistence, K>(options?.select),
    });
  }

  findMany<K extends keyof PermissionPersistence = keyof PermissionPersistence>(
    params: { resource?: string; isActive?: boolean },
    options?: PermissionPersistenceQueryOptions<K>,
    tx?: DatabaseTx,
  ): Promise<PermissionRow[]> {
    return resolvePrismaClient(tx, this.prisma).permission.findMany({
      where: { resource: params.resource, isActive: params.isActive },
      select: buildPrismaSelect<PermissionPersistence, K>(options?.select),
    });
  }
}
