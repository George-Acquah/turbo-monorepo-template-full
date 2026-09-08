import { DatabaseTx } from '../shared';
import {
  DeadLetterEventPersistence,
  CreateDeadLetterEventInput,
  UpdateDeadLetterEventInput,
  DeadLetterEventPersistenceQueryOptions,
} from './types';

export abstract class DeadLetterEventRepositoryPort {
  /**
   * Records a failed event into the Dead Letter Queue after max retry attempts are exhausted.
   */
  abstract create<K extends keyof DeadLetterEventPersistence = keyof DeadLetterEventPersistence>(
    data: CreateDeadLetterEventInput,
    tx?: DatabaseTx,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<Pick<DeadLetterEventPersistence, K>>;

  /**
   * Retrieves an unresolved DLQ event by its ID.
   */
  abstract findById<K extends keyof DeadLetterEventPersistence = keyof DeadLetterEventPersistence>(
    dlqEventId: string,
    tx?: DatabaseTx,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<Pick<DeadLetterEventPersistence, K> | null>;

  /**
   * Retrieves a paginated list of dead letter events, optionally filtered by status and tenant.
   */
  abstract findMany<K extends keyof DeadLetterEventPersistence = keyof DeadLetterEventPersistence>(
    params: {
      tenantId?: string | null;
      status?: DeadLetterEventPersistence['status'];
      limit?: number;
      offset?: number;
    },
    tx?: DatabaseTx,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<Pick<DeadLetterEventPersistence, K>[]>;

  /**
   * Resolve an DLQ event.
   */
  abstract resolveDLQEvent<
    K extends keyof DeadLetterEventPersistence = keyof DeadLetterEventPersistence,
  >(
    dlqEventId: string,
    data: Omit<UpdateDeadLetterEventInput, 'status' | 'nextRetryAt'>,
    tx?: DatabaseTx,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<Pick<DeadLetterEventPersistence, K>>;

  /**
   * Retry an DLQ event.
   */
  abstract retryDLQEvent<
    K extends keyof DeadLetterEventPersistence = keyof DeadLetterEventPersistence,
  >(
    dlqEventId: string,
    data: Omit<UpdateDeadLetterEventInput, 'status'>,
    tx?: DatabaseTx,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<Pick<DeadLetterEventPersistence, K>>;

  /**
   * Marks a DLQ event as COMPLETED and finalizes audit trail.
   */
  abstract markAsCompleted<
    K extends keyof DeadLetterEventPersistence = keyof DeadLetterEventPersistence,
  >(
    dlqEventId: string,
    data: Omit<UpdateDeadLetterEventInput, 'status'>,
    tx?: DatabaseTx,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<Pick<DeadLetterEventPersistence, K>>;
}

export const DEAD_LETTER_EVENT_REPOSITORY_TOKEN = Symbol('DEAD_LETTER_EVENT_REPOSITORY_TOKEN');
export const PRISMA_DEAD_LETTER_EVENT_REPOSITORY_TOKEN = Symbol(
  'PRISMA_DEAD_LETTER_EVENT_REPOSITORY_TOKEN',
);
