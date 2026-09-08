import { DatabaseTx } from '../shared';
import {
  OutboxEventPersistence,
  CreateOutboxEventInput,
  OutboxEventPersistenceQueryOptions,
} from './types';

export abstract class OutboxEventRepositoryPort {
  /**
   * Appends a new event to the transactional outbox.
   * Typically executed within the same transaction as the domain mutation.
   */
  abstract enqueueTx<K extends keyof OutboxEventPersistence = keyof OutboxEventPersistence>(
    event: CreateOutboxEventInput,
    tx?: DatabaseTx,
    options?: OutboxEventPersistenceQueryOptions<K>,
  ): Promise<Pick<OutboxEventPersistence, K>>;

  /**
   * Atomically claims a batch of dispatchable events for this worker,
   * transitioning them PENDING|FAILED -> PROCESSING and returning the claimed
   * rows. Implementations MUST make the select-and-claim atomic (Postgres:
   * `FOR UPDATE SKIP LOCKED`) so that concurrent workers never claim the same
   * row — this is the only thing preventing duplicate event dispatch when
   * more than one worker replica runs.
   *
   * Deliberately covers retries too: rows in FAILED whose `nextRetryAt` has
   * elapsed are claimed alongside fresh PENDING rows, so a transient failure
   * is retried rather than stranded.
   *
   * Returns whole rows (no partial-select option) because the claim is a
   * write returning its affected rows, not a projectable read.
   */
  abstract claimPendingEvents(
    batchSize: number,
    tx?: DatabaseTx,
  ): Promise<OutboxEventPersistence[]>;

  /**
   * Returns rows stranded in PROCESSING to PENDING so they can be claimed
   * again. A worker killed mid-batch (deploy restart, OOM, SIGKILL past the
   * shutdown grace window) leaves rows claimed but never completed; without
   * this sweep nothing would ever pick them up again.
   *
   * Resolves to the number of rows reclaimed.
   */
  abstract reclaimStuckProcessing(stuckBefore: Date, tx?: DatabaseTx): Promise<number>;

  /**
   * Marks an existing outbox event as processed.
   */
  abstract markProcessed<K extends keyof OutboxEventPersistence = keyof OutboxEventPersistence>(
    id: string,
    tx?: DatabaseTx,
    options?: OutboxEventPersistenceQueryOptions<K>,
  ): Promise<Pick<OutboxEventPersistence, K>>;

  /**
   * Records a failed dispatch attempt and increments `attempts`.
   *
   * `retryAt` decides the resulting state: a date schedules the next retry
   * (status FAILED, `nextRetryAt` set, picked up again by
   * {@link claimPendingEvents}); `null`/omitted means the retry budget is
   * exhausted and the row is terminal (status DEAD_LETTERED).
   */
  abstract markFailed<K extends keyof OutboxEventPersistence = keyof OutboxEventPersistence>(
    id: string,
    errorMessage: string,
    retryAt?: Date | null,
    tx?: DatabaseTx,
    options?: OutboxEventPersistenceQueryOptions<K>,
  ): Promise<Pick<OutboxEventPersistence, K>>;

  /**
   * Cleans up successfully processed events older than a specific date to prevent unbounded table growth.
   */
  abstract pruneProcessedEvents(olderThan: Date, tx?: DatabaseTx): Promise<number>;
}

export const OUTBOX_EVENT_REPOSITORY_TOKEN = Symbol('OUTBOX_EVENT_REPOSITORY_TOKEN');
export const PRISMA_OUTBOX_EVENT_REPOSITORY_TOKEN = Symbol('PRISMA_OUTBOX_EVENT_REPOSITORY_TOKEN');
