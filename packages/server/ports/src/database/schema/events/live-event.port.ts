import { DatabaseTx } from '../shared';
import {
  LiveEventPersistence,
  CreateLiveEventInput,
  UpdateLiveEventInput,
  LiveEventPersistenceQueryOptions,
} from './events.types';

export abstract class LiveEventRepositoryPort {
  abstract create(data: CreateLiveEventInput, tx?: DatabaseTx): Promise<LiveEventPersistence>;

  abstract update(
    id: string,
    data: UpdateLiveEventInput,
    tx?: DatabaseTx,
  ): Promise<LiveEventPersistence>;

  /**
   * Atomically adjusts seatsTaken (positive delta on registration, negative
   * on cancellation). Callers enforce seatsTaken <= capacity at the use-case
   * layer using a fresh read inside the same transaction.
   */
  abstract adjustSeatsTaken(
    id: string,
    delta: number,
    tx?: DatabaseTx,
  ): Promise<LiveEventPersistence>;

  //Reads

  abstract findById<K extends keyof LiveEventPersistence = keyof LiveEventPersistence>(
    id: string,
    options?: LiveEventPersistenceQueryOptions<K>,
  ): Promise<Pick<LiveEventPersistence, K> | null>;

  abstract findBySlug<K extends keyof LiveEventPersistence = keyof LiveEventPersistence>(
    slug: string,
    options?: LiveEventPersistenceQueryOptions<K>,
  ): Promise<Pick<LiveEventPersistence, K> | null>;

  abstract findMany<K extends keyof LiveEventPersistence = keyof LiveEventPersistence>(
    filter: { status?: LiveEventPersistence['status']; kind?: LiveEventPersistence['kind'] },
    options?: LiveEventPersistenceQueryOptions<K>,
  ): Promise<Pick<LiveEventPersistence, K>[]>;
}

export const LIVE_EVENT_REPOSITORY_TOKEN = Symbol('LIVE_EVENT_REPOSITORY_TOKEN');
export const PRISMA_LIVE_EVENT_REPOSITORY_TOKEN = Symbol('PRISMA_LIVE_EVENT_REPOSITORY_TOKEN');
