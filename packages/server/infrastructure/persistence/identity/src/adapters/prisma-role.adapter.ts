import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  RoleRepositoryPort,
  type RolePersistence,
  type CreateRoleInput,
  type UpdateRoleInput,
  type RolePermissionPersistence,
  type AssignRolePermissionInput,
  type RolePersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { RoleQuery } from '../queries/role.query';

@Injectable()
export class PrismaRoleAdapter implements RoleRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly roleQuery: RoleQuery,
  ) {}

  async create(data: CreateRoleInput, tx?: DatabaseTx): Promise<RolePersistence> {
    const { id, metadata, ...rest } = data;
    return resolvePrismaClient(tx, this.prisma).role.create({
      data: { id: id ?? generateId(IdPrefixes.ROLE), ...rest, metadata: metadata ?? undefined },
    });
  }

  async update(id: string, data: UpdateRoleInput, tx?: DatabaseTx): Promise<RolePersistence> {
    const { metadata, ...rest } = data;
    return resolvePrismaClient(tx, this.prisma).role.update({
      where: { id },
      data: { ...rest, metadata: metadata ?? undefined },
    });
  }

  async softDelete(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).role.update({
      where: { id },
      data: { isActive: false },
    });
  }

  //Reads

  async findById<K extends keyof RolePersistence = keyof RolePersistence>(
    id: string,
    options?: RolePersistenceQueryOptions<K>,
  ): Promise<Pick<RolePersistence, K> | null> {
    return (await this.roleQuery.findById(id, options)) as Pick<RolePersistence, K> | null;
  }

  async findByKey<K extends keyof RolePersistence = keyof RolePersistence>(
    key: string,
    options?: RolePersistenceQueryOptions<K>,
  ): Promise<Pick<RolePersistence, K> | null> {
    return (await this.roleQuery.findByKey(key, options)) as Pick<RolePersistence, K> | null;
  }

  async findMany<K extends keyof RolePersistence = keyof RolePersistence>(
    params: { isActive?: boolean },
    options?: RolePersistenceQueryOptions<K>,
  ): Promise<Pick<RolePersistence, K>[]> {
    return (await this.roleQuery.findMany(params, options)) as Pick<RolePersistence, K>[];
  }

  // ── Permission links ────────────────────────────────────────────────────

  async assignPermission(
    data: AssignRolePermissionInput,
    tx?: DatabaseTx,
  ): Promise<RolePermissionPersistence> {
    return resolvePrismaClient(tx, this.prisma).rolePermission.create({
      data: {
        roleId: data.roleId,
        permissionId: data.permissionId,
        createdByUserId: data.createdByUserId ?? null,
      },
    });
  }

  async revokePermission(roleId: string, permissionId: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }

  async findRolePermissions(roleId: string, tx?: DatabaseTx): Promise<string[]> {
    const rows = await resolvePrismaClient(tx, this.prisma).rolePermission.findMany({
      where: { roleId, permission: { isActive: true } },
      select: { permission: { select: { key: true } } },
    });
    return rows.map((row: { permission: { key: string } }) => row.permission.key);
  }
}
