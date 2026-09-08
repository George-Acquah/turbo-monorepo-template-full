import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  UserRepositoryPort,
  type UserPersistence,
  type CreateUserInput,
  type UpdateUserProfileInput,
  type UpdateUserSecurityInput,
  type UserPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { UserConverter } from '../converter/user.converter';
import { UserQuery } from '../queries/user.query';

@Injectable()
export class PrismaUserAdapter implements UserRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly userQuery: UserQuery,
  ) {}

  async create(data: CreateUserInput, tx?: DatabaseTx): Promise<UserPersistence> {
    const id = data.id ?? generateId(IdPrefixes.USER);
    const row = await resolvePrismaClient(tx, this.prisma).user.create({
      data: UserConverter.toCreateData(data, id),
    });
    return UserConverter.toPersistence(row);
  }

  async updateProfile(
    id: string,
    data: UpdateUserProfileInput,
    tx?: DatabaseTx,
  ): Promise<UserPersistence> {
    const row = await resolvePrismaClient(tx, this.prisma).user.update({
      where: { id },
      data: UserConverter.toProfileUpdateData(data),
    });
    return UserConverter.toPersistence(row);
  }

  async updateSecurity(
    id: string,
    data: UpdateUserSecurityInput,
    tx?: DatabaseTx,
  ): Promise<UserPersistence> {
    const row = await resolvePrismaClient(tx, this.prisma).user.update({
      where: { id },
      data: UserConverter.toSecurityUpdateData(data),
    });
    return UserConverter.toPersistence(row);
  }

  async incrementFailedLogins(id: string, lockUntil?: Date, tx?: DatabaseTx): Promise<number> {
    const row = await resolvePrismaClient(tx, this.prisma).user.update({
      where: { id },
      data: {
        failedLoginCount: { increment: 1 },
        ...(lockUntil ? { lockedUntil: lockUntil } : {}),
      },
      select: { failedLoginCount: true },
    });
    return row.failedLoginCount;
  }

  async resetFailedLogins(
    id: string,
    lastLoginIp?: string,
    lastLoginAt?: Date,
    tx?: DatabaseTx,
  ): Promise<UserPersistence> {
    const row = await resolvePrismaClient(tx, this.prisma).user.update({
      where: { id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        ...(lastLoginIp ? { lastLoginIp } : {}),
        lastLoginAt: lastLoginAt ?? new Date(),
      },
    });
    return UserConverter.toPersistence(row);
  }

  async softDelete(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DEACTIVATED' },
    });
  }

  //Reads

  async findById<K extends keyof UserPersistence = keyof UserPersistence>(
    id: string,
    options?: UserPersistenceQueryOptions<K>,
  ): Promise<Pick<UserPersistence, K> | null> {
    const row = await this.userQuery.findById(id, options);
    return row ? (UserConverter.toPartialPersistence(row) as Pick<UserPersistence, K>) : null;
  }

  async findByEmail<K extends keyof UserPersistence = keyof UserPersistence>(
    email: string,
    options?: UserPersistenceQueryOptions<K>,
  ): Promise<Pick<UserPersistence, K> | null> {
    const row = await this.userQuery.findByEmail(email, options);
    return row ? (UserConverter.toPartialPersistence(row) as Pick<UserPersistence, K>) : null;
  }

  async findByPhone<K extends keyof UserPersistence = keyof UserPersistence>(
    phone: string,
    options?: UserPersistenceQueryOptions<K>,
  ): Promise<Pick<UserPersistence, K> | null> {
    const row = await this.userQuery.findByPhone(phone, options);
    return row ? (UserConverter.toPartialPersistence(row) as Pick<UserPersistence, K>) : null;
  }
}
