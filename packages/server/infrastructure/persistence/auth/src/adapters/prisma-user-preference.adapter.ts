import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  UserPreferenceRepositoryPort,
  type UserPreferencePersistence,
  type CreateUserPreferenceInput,
  type UpdateUserPreferenceInput,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { DEFAULT_USER_PREFERENCES } from '../constants/auth-persistence.constants';
import { UserPreferenceConverter } from '../converter/user-preference.converter';

@Injectable()
export class PrismaUserPreferenceAdapter implements UserPreferenceRepositoryPort {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  async create(
    data: CreateUserPreferenceInput,
    tx?: DatabaseTx,
  ): Promise<UserPreferencePersistence> {
    const { id, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).userPreference.create({
      data: { id: id ?? generateId(IdPrefixes.USER_PREFERENCE), ...rest },
    });
    return UserPreferenceConverter.toPersistence(row);
  }

  async findByUserId(
    userId: string,
    tx?: DatabaseTx,
  ): Promise<UserPreferencePersistence | null> {
    const row = await resolvePrismaClient(tx, this.prisma).userPreference.findUnique({
      where: { userId },
    });
    return row ? UserPreferenceConverter.toPersistence(row) : null;
  }

  async updateByUserId(
    userId: string,
    data: UpdateUserPreferenceInput,
    tx?: DatabaseTx,
  ): Promise<UserPreferencePersistence> {
    const row = await resolvePrismaClient(tx, this.prisma).userPreference.update({
      where: { userId },
      data,
    });
    return UserPreferenceConverter.toPersistence(row);
  }

  /**
   * A row is normally created alongside the User (see transactions/auth.transaction.ts
   * `withUserCreation`), so `updateByUserId` would usually be enough. Upsert exists because that
   * guarantee doesn't hold retroactively: users created before that path existed — or through any
   * future flow that skips it — have no row, and a settings save must not 404 for them.
   */
  async upsertByUserId(
    userId: string,
    data: UpdateUserPreferenceInput,
    tx?: DatabaseTx,
  ): Promise<UserPreferencePersistence> {
    const row = await resolvePrismaClient(tx, this.prisma).userPreference.upsert({
      where: { userId },
      create: {
        id: generateId(IdPrefixes.USER_PREFERENCE),
        userId,
        ...DEFAULT_USER_PREFERENCES,
        ...data,
      },
      // Partial by design — omitted keys keep their stored value rather than resetting.
      update: data,
    });
    return UserPreferenceConverter.toPersistence(row);
  }
}
