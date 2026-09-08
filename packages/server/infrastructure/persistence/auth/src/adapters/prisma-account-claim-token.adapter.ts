import { Inject, Injectable } from '@nestjs/common';
import { AccountClaimTokenStatus, IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  AccountClaimTokenRepositoryPort,
  type AccountClaimTokenPersistence,
  type CreateAccountClaimTokenInput,
  type AccountClaimTokenPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { AccountClaimTokenQuery } from '../queries/account-claim-token.query';

@Injectable()
export class PrismaAccountClaimTokenAdapter implements AccountClaimTokenRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly accountClaimTokenQuery: AccountClaimTokenQuery,
  ) {}

  create(
    data: CreateAccountClaimTokenInput,
    tx?: DatabaseTx,
  ): Promise<AccountClaimTokenPersistence> {
    const { id, status, ...rest } = data;
    return resolvePrismaClient(tx, this.prisma).accountClaimToken.create({
      data: {
        id: id ?? generateId(IdPrefixes.ACCOUNT_CLAIM_TOKEN),
        status: status ?? AccountClaimTokenStatus.PENDING,
        ...rest,
      },
    });
  }

  markClaimed(
    id: string,
    claimedUserId: string,
    tx?: DatabaseTx,
  ): Promise<AccountClaimTokenPersistence> {
    return resolvePrismaClient(tx, this.prisma).accountClaimToken.update({
      where: { id },
      data: { status: AccountClaimTokenStatus.ACCEPTED, claimedUserId, claimedAt: new Date() },
    });
  }

  markCancelled(id: string, tx?: DatabaseTx): Promise<AccountClaimTokenPersistence> {
    return resolvePrismaClient(tx, this.prisma).accountClaimToken.update({
      where: { id },
      data: { status: AccountClaimTokenStatus.CANCELLED },
    });
  }

  //Reads

  findById<
    K extends keyof AccountClaimTokenPersistence = keyof AccountClaimTokenPersistence,
  >(
    id: string,
    options?: AccountClaimTokenPersistenceQueryOptions<K>,
  ): Promise<Pick<AccountClaimTokenPersistence, K> | null> {
    return this.accountClaimTokenQuery.findById(id, options) as Promise<
      Pick<AccountClaimTokenPersistence, K> | null
    >;
  }

  findByToken<
    K extends keyof AccountClaimTokenPersistence = keyof AccountClaimTokenPersistence,
  >(
    tokenHash: string,
    options?: AccountClaimTokenPersistenceQueryOptions<K>,
  ): Promise<Pick<AccountClaimTokenPersistence, K> | null> {
    return this.accountClaimTokenQuery.findByToken(tokenHash, options) as Promise<
      Pick<AccountClaimTokenPersistence, K> | null
    >;
  }

  findActiveForProfile<
    K extends keyof AccountClaimTokenPersistence = keyof AccountClaimTokenPersistence,
  >(
    profileId: string,
    options?: AccountClaimTokenPersistenceQueryOptions<K>,
  ): Promise<Pick<AccountClaimTokenPersistence, K>[]> {
    return this.accountClaimTokenQuery.findActiveForProfile(profileId, options) as Promise<
      Pick<AccountClaimTokenPersistence, K>[]
    >;
  }

  async expireOverdue(tx?: DatabaseTx): Promise<number> {
    const result = await resolvePrismaClient(tx, this.prisma).accountClaimToken.updateMany({
      where: { status: AccountClaimTokenStatus.PENDING, expiresAt: { lt: new Date() } },
      data: { status: AccountClaimTokenStatus.EXPIRED },
    });
    return result.count;
  }
}
