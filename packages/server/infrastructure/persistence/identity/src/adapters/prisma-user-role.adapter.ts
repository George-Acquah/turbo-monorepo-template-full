import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  UserRoleRepositoryPort,
  type UserRolePersistence,
  type CreateUserRoleInput,
  type RevokeUserRoleInput,
  type UserRoleWithRolePersistence,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';

@Injectable()
export class PrismaUserRoleAdapter implements UserRoleRepositoryPort {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  async assign(data: CreateUserRoleInput, tx?: DatabaseTx): Promise<UserRolePersistence> {
    const { id, ...rest } = data;
    return resolvePrismaClient(tx, this.prisma).userRole.create({
      data: { id: id ?? generateId(IdPrefixes.USER_ROLE), ...rest },
    });
  }

  async revoke(
    userId: string,
    data: RevokeUserRoleInput,
    tx?: DatabaseTx,
  ): Promise<UserRolePersistence> {
    return resolvePrismaClient(tx, this.prisma).userRole.update({
      where: { userId_roleId: { userId, roleId: data.roleId } },
      data: { revokedAt: data.revokedAt ?? new Date() },
    });
  }

  async findActiveAssignments(
    userId: string,
    tx?: DatabaseTx,
  ): Promise<UserRoleWithRolePersistence[]> {
    const rows = await resolvePrismaClient(tx, this.prisma).userRole.findMany({
      where: {
        userId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { role: { select: { id: true, key: true, name: true } } },
    });
    return rows;
  }
}
