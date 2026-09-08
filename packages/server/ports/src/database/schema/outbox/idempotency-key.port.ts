import { DatabaseTx } from '../shared';
import {
  IdempotencyKeyPersistence,
  CreateIdempotencyKeyInput,
  UpdateIdempotencyKeyInput,
  IdempotencyDecision,
  IdempotencyKeyPersistenceQueryOptions,
} from './types';

export abstract class IdempotencyKeyRepositoryPort {
  /**
   * Attempts to create a new idempotency key. If it already exists (by unique constraint),
   * it should throw a specific conflict error or be handled depending on the implementation.
   */
  abstract begin(input: CreateIdempotencyKeyInput, tx?: DatabaseTx): Promise<IdempotencyDecision>;

  abstract complete(
    input: Omit<CreateIdempotencyKeyInput, 'requestHash' | 'expiresAt'>,
    tx?: DatabaseTx,
  ): Promise<void>;

  abstract fail(
    input: Omit<CreateIdempotencyKeyInput, 'requestHash' | 'expiresAt'>,
    tx?: DatabaseTx,
  ): Promise<void>;

  /**
   * Retrieves an idempotency key by the unique combination of tenantId, scope, and key.
   */
  abstract findByKey<K extends keyof IdempotencyKeyPersistence = keyof IdempotencyKeyPersistence>(
    tenantId: string | null,
    scope: string,
    key: string,
    tx?: DatabaseTx,
    options?: IdempotencyKeyPersistenceQueryOptions<K>,
  ): Promise<Pick<IdempotencyKeyPersistence, K> | null>;

  /**
   * Updates the outcome of an idempotent operation (e.g., storing the response payload and status).
   */
  abstract update<K extends keyof IdempotencyKeyPersistence = keyof IdempotencyKeyPersistence>(
    id: string,
    data: UpdateIdempotencyKeyInput,
    tx?: DatabaseTx,
    options?: IdempotencyKeyPersistenceQueryOptions<K>,
  ): Promise<Pick<IdempotencyKeyPersistence, K>>;

  /**
   * Prunes expired idempotency keys from the database to maintain performance.
   */
  abstract deleteExpiredKeys(now: Date, tx?: DatabaseTx): Promise<number>;
}

export const IDEMPOTENCY_KEY_REPOSITORY_TOKEN = Symbol('IDEMPOTENCY_KEY_REPOSITORY_TOKEN');
export const PRISMA_IDEMPOTENCY_KEY_REPOSITORY_TOKEN = Symbol(
  'PRISMA_IDEMPOTENCY_KEY_REPOSITORY_TOKEN',
);
