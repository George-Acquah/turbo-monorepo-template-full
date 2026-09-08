import { Inject, Injectable } from '@nestjs/common';
import type { RolePersistence, RolePersistenceQueryOptions } from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { Role as PrismaRoleModel } from '@workspace/prisma/client';

type RoleRow = Partial<PrismaRoleModel>;

@Injectable()
export class RoleQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof RolePersistence = keyof RolePersistence>(
    id: string,
    options?: RolePersistenceQueryOptions<K>,
  ): Promise<RoleRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).role.findUnique({
      where: { id },
      select: buildPrismaSelect<RolePersistence, K>(options?.select),
    });
  }

  findByKey<K extends keyof RolePersistence = keyof RolePersistence>(
    key: string,
    options?: RolePersistenceQueryOptions<K>,
  ): Promise<RoleRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).role.findUnique({
      where: { key },
      select: buildPrismaSelect<RolePersistence, K>(options?.select),
    });
  }

  findMany<K extends keyof RolePersistence = keyof RolePersistence>(
    params: { isActive?: boolean },
    options?: RolePersistenceQueryOptions<K>,
  ): Promise<RoleRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).role.findMany({
      where: { isActive: params.isActive },
      select: buildPrismaSelect<RolePersistence, K>(options?.select),
    });
  }
}
