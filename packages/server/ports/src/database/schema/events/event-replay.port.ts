import { DatabaseTx } from '../shared';
import {
  EventReplayPersistence,
  CreateEventReplayInput,
  UpdateEventReplayInput,
  EventReplayPersistenceQueryOptions,
} from './events.types';

export abstract class EventReplayRepositoryPort {
  abstract create(data: CreateEventReplayInput, tx?: DatabaseTx): Promise<EventReplayPersistence>;

  abstract update(
    id: string,
    data: UpdateEventReplayInput,
    tx?: DatabaseTx,
  ): Promise<EventReplayPersistence>;

  abstract publish(id: string, tx?: DatabaseTx): Promise<EventReplayPersistence>;

  //Reads

  abstract findById<K extends keyof EventReplayPersistence = keyof EventReplayPersistence>(
    id: string,
    options?: EventReplayPersistenceQueryOptions<K>,
  ): Promise<Pick<EventReplayPersistence, K> | null>;

  abstract findByEventId<K extends keyof EventReplayPersistence = keyof EventReplayPersistence>(
    eventId: string,
    options?: EventReplayPersistenceQueryOptions<K>,
  ): Promise<Pick<EventReplayPersistence, K> | null>;
}

export const EVENT_REPLAY_REPOSITORY_TOKEN = Symbol('EVENT_REPLAY_REPOSITORY_TOKEN');
export const PRISMA_EVENT_REPLAY_REPOSITORY_TOKEN = Symbol('PRISMA_EVENT_REPLAY_REPOSITORY_TOKEN');
