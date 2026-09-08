import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  PasswordResetTokenRepositoryPort,
  type PasswordResetTokenPersistence,
  type CreatePasswordResetTokenInput,
  type PasswordResetTokenPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import {
  PrismaService,
  PRISMA_CLIENT_TOKEN,
  resolvePrismaClient,
  buildPrismaSelect,
} from '@workspace/prisma';

@Injectable()
export class PrismaPasswordResetTokenAdapter implements PasswordResetTokenRepositoryPort {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  create(
    data: CreatePasswordResetTokenInput,
    tx?: DatabaseTx,
  ): Promise<PasswordResetTokenPersistence> {
    const { id, ...rest } = data;
    return resolvePrismaClient(tx, this.prisma).passwordResetToken.create({
      data: { id: id ?? generateId(IdPrefixes.PASSWORD_RESET), ...rest },
    });
  }

  async markAsUsed(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async invalidateAllForUser(userId: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  findByTokenHash<K extends keyof PasswordResetTokenPersistence>(
    tokenHash: string,
    options?: PasswordResetTokenPersistenceQueryOptions<K>,
  ): Promise<Pick<PasswordResetTokenPersistence, K> | null> {
    return resolvePrismaClient(options?.tx, this.prisma).passwordResetToken.findUnique({
      where: { tokenHash },
      select: buildPrismaSelect<PasswordResetTokenPersistence, K>(options?.select),
    }) as Promise<Pick<PasswordResetTokenPersistence, K> | null>;
  }
}
