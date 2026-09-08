import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  EmailVerificationTokenRepositoryPort,
  type EmailVerificationTokenPersistence,
  type CreateEmailVerificationTokenInput,
  type EmailVerificationTokenPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import {
  PrismaService,
  PRISMA_CLIENT_TOKEN,
  resolvePrismaClient,
  buildPrismaSelect,
} from '@workspace/prisma';

@Injectable()
export class PrismaEmailVerificationTokenAdapter implements EmailVerificationTokenRepositoryPort {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  create(
    data: CreateEmailVerificationTokenInput,
    tx?: DatabaseTx,
  ): Promise<EmailVerificationTokenPersistence> {
    const { id, ...rest } = data;
    return resolvePrismaClient(tx, this.prisma).emailVerificationToken.create({
      data: { id: id ?? generateId(IdPrefixes.EMAIL_VERIFICATION), ...rest },
    });
  }

  async markAsUsed(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async invalidateAllForUser(userId: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  //Reads

  findByTokenHash<
    K extends keyof EmailVerificationTokenPersistence = keyof EmailVerificationTokenPersistence,
  >(
    tokenHash: string,
    options?: EmailVerificationTokenPersistenceQueryOptions<K>,
  ): Promise<Pick<EmailVerificationTokenPersistence, K> | null> {
    return resolvePrismaClient(options?.tx, this.prisma).emailVerificationToken.findUnique({
      where: { tokenHash },
      select: buildPrismaSelect<EmailVerificationTokenPersistence, K>(options?.select),
    }) as Promise<Pick<EmailVerificationTokenPersistence, K> | null>;
  }
}
