import { DatabaseTx } from '../shared';
import {
  AccountClaimTokenPersistence,
  CreateAccountClaimTokenInput,
  AccountClaimTokenPersistenceQueryOptions,
} from './auth.types';

export abstract class AccountClaimTokenRepositoryPort {
  abstract create(
    data: CreateAccountClaimTokenInput,
    tx?: DatabaseTx,
  ): Promise<AccountClaimTokenPersistence>;

  abstract markClaimed(
    id: string,
    claimedUserId: string,
    tx?: DatabaseTx,
  ): Promise<AccountClaimTokenPersistence>;

  abstract markCancelled(id: string, tx?: DatabaseTx): Promise<AccountClaimTokenPersistence>;

  //Reads
  abstract findById<
    K extends keyof AccountClaimTokenPersistence = keyof AccountClaimTokenPersistence,
  >(
    id: string,
    options?: AccountClaimTokenPersistenceQueryOptions<K>,
  ): Promise<Pick<AccountClaimTokenPersistence, K> | null>;

  abstract findByToken<
    K extends keyof AccountClaimTokenPersistence = keyof AccountClaimTokenPersistence,
  >(
    tokenHash: string,
    options?: AccountClaimTokenPersistenceQueryOptions<K>,
  ): Promise<Pick<AccountClaimTokenPersistence, K> | null>;

  /**
   * Still-PENDING tokens for a profile — used to avoid minting duplicate
   * claim tokens for the same guest profile.
   */
  abstract findActiveForProfile<
    K extends keyof AccountClaimTokenPersistence = keyof AccountClaimTokenPersistence,
  >(
    profileId: string,
    options?: AccountClaimTokenPersistenceQueryOptions<K>,
  ): Promise<Pick<AccountClaimTokenPersistence, K>[]>;

  /**
   * Marks all overdue PENDING tokens as EXPIRED. Returns the count updated.
   */
  abstract expireOverdue(tx?: DatabaseTx): Promise<number>;
}

export const ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN = Symbol('ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN');
export const PRISMA_ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN = Symbol(
  'PRISMA_ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN',
);
