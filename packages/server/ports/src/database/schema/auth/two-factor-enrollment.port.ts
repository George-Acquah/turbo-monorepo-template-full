import { TwoFactorMethod } from '@workspace/constants';
import { DatabaseTx } from '../shared';
import {
  TwoFactorEnrollmentPersistence,
  CreateTwoFactorEnrollmentInput,
  UpdateTwoFactorEnrollmentInput,
  TwoFactorEnrollmentPersistenceQueryOptions,
} from './auth.types';

export abstract class TwoFactorEnrollmentRepositoryPort {
  abstract create(
    data: CreateTwoFactorEnrollmentInput,
    tx?: DatabaseTx,
  ): Promise<TwoFactorEnrollmentPersistence>;

  abstract update(
    id: string,
    data: UpdateTwoFactorEnrollmentInput,
    tx?: DatabaseTx,
  ): Promise<TwoFactorEnrollmentPersistence>;

  /**
   * Soft deletes a 2FA method (disabling it).
   */
  abstract softDelete(id: string, tx?: DatabaseTx): Promise<void>;

  abstract findById<
    K extends keyof TwoFactorEnrollmentPersistence = keyof TwoFactorEnrollmentPersistence,
  >(
    id: string,
    options?: TwoFactorEnrollmentPersistenceQueryOptions<K>,
  ): Promise<Pick<TwoFactorEnrollmentPersistence, K> | null>;

  /**
   * Finds a specific enrollment method for a user.
   */
  abstract findByMethod<
    K extends keyof TwoFactorEnrollmentPersistence = keyof TwoFactorEnrollmentPersistence,
  >(
    userId: string,
    method: TwoFactorMethod,
    options?: TwoFactorEnrollmentPersistenceQueryOptions<K>,
  ): Promise<Pick<TwoFactorEnrollmentPersistence, K> | null>;

  /**
   * Retrieves the primary active 2FA method for a user.
   */
  abstract findPrimaryForUser<
    K extends keyof TwoFactorEnrollmentPersistence = keyof TwoFactorEnrollmentPersistence,
  >(
    userId: string,
    options?: TwoFactorEnrollmentPersistenceQueryOptions<K>,
  ): Promise<Pick<TwoFactorEnrollmentPersistence, K> | null>;

  abstract findActiveByUserId<
    K extends keyof TwoFactorEnrollmentPersistence = keyof TwoFactorEnrollmentPersistence,
  >(
    userId: string,
    options?: TwoFactorEnrollmentPersistenceQueryOptions<K>,
  ): Promise<Pick<TwoFactorEnrollmentPersistence, K>[]>;
}

export const TWO_FACTOR_ENROLLMENT_REPOSITORY_TOKEN = Symbol(
  'TWO_FACTOR_ENROLLMENT_REPOSITORY_TOKEN',
);
export const PRISMA_TWO_FACTOR_ENROLLMENT_REPOSITORY_TOKEN = Symbol(
  'PRISMA_TWO_FACTOR_ENROLLMENT_REPOSITORY_TOKEN',
);
