import { Inject, Injectable } from '@nestjs/common';
import type {
  AccountClaimTokenPersistence,
  AccountClaimTokenPersistenceQueryOptions,
} from '@workspace/ports';
import {
  PrismaService,
  PRISMA_CLIENT_TOKEN,
  resolvePrismaClient,
  buildPrismaSelect,
} from '@workspace/prisma';
import type { AccountClaimToken as PrismaAccountClaimToken } from '@workspace/prisma/client';
import { AccountClaimTokenStatus } from '@workspace/constants';

type AccountClaimTokenRow = Partial<PrismaAccountClaimToken>;

@Injectable()
export class AccountClaimTokenQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<
    K extends keyof AccountClaimTokenPersistence = keyof AccountClaimTokenPersistence,
  >(
    id: string,
    options?: AccountClaimTokenPersistenceQueryOptions<K>,
  ): Promise<AccountClaimTokenRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).accountClaimToken.findUnique({
      where: { id },
      select: buildPrismaSelect<AccountClaimTokenPersistence, K>(options?.select),
    });
  }

  findByToken<
    K extends keyof AccountClaimTokenPersistence = keyof AccountClaimTokenPersistence,
  >(
    tokenHash: string,
    options?: AccountClaimTokenPersistenceQueryOptions<K>,
  ): Promise<AccountClaimTokenRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).accountClaimToken.findUnique({
      where: { tokenHash },
      select: buildPrismaSelect<AccountClaimTokenPersistence, K>(options?.select),
    });
  }

  findActiveForProfile<
    K extends keyof AccountClaimTokenPersistence = keyof AccountClaimTokenPersistence,
  >(
    profileId: string,
    options?: AccountClaimTokenPersistenceQueryOptions<K>,
  ): Promise<AccountClaimTokenRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).accountClaimToken.findMany({
      where: { profileId, status: AccountClaimTokenStatus.PENDING },
      select: buildPrismaSelect<AccountClaimTokenPersistence, K>(options?.select),
    });
  }
}
