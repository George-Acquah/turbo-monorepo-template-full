import { DatabaseTx } from '../shared';
import {
  EventRegistrationPersistence,
  CreateEventRegistrationInput,
  UpdateEventRegistrationInput,
  EventRegistrationPersistenceQueryOptions,
} from './events.types';

export abstract class EventRegistrationRepositoryPort {
  abstract create(
    data: CreateEventRegistrationInput,
    tx?: DatabaseTx,
  ): Promise<EventRegistrationPersistence>;

  abstract update(
    id: string,
    data: UpdateEventRegistrationInput,
    tx?: DatabaseTx,
  ): Promise<EventRegistrationPersistence>;

  //Reads

  abstract findById<
    K extends keyof EventRegistrationPersistence = keyof EventRegistrationPersistence,
  >(
    id: string,
    options?: EventRegistrationPersistenceQueryOptions<K>,
  ): Promise<Pick<EventRegistrationPersistence, K> | null>;

  abstract findByEventAndProfile<
    K extends keyof EventRegistrationPersistence = keyof EventRegistrationPersistence,
  >(
    eventId: string,
    profileId: string,
    options?: EventRegistrationPersistenceQueryOptions<K>,
  ): Promise<Pick<EventRegistrationPersistence, K> | null>;

  abstract findByEvent<
    K extends keyof EventRegistrationPersistence = keyof EventRegistrationPersistence,
  >(
    eventId: string,
    options?: EventRegistrationPersistenceQueryOptions<K>,
  ): Promise<Pick<EventRegistrationPersistence, K>[]>;

  abstract findByProfile<
    K extends keyof EventRegistrationPersistence = keyof EventRegistrationPersistence,
  >(
    profileId: string,
    options?: EventRegistrationPersistenceQueryOptions<K>,
  ): Promise<Pick<EventRegistrationPersistence, K>[]>;

  /**
   * Confirmed registrations with remindAt due (<= now) that haven't fired yet.
   */
  abstract findDueForReminder<
    K extends keyof EventRegistrationPersistence = keyof EventRegistrationPersistence,
  >(
    before: Date,
    options?: EventRegistrationPersistenceQueryOptions<K>,
  ): Promise<Pick<EventRegistrationPersistence, K>[]>;
}

export const EVENT_REGISTRATION_REPOSITORY_TOKEN = Symbol('EVENT_REGISTRATION_REPOSITORY_TOKEN');
export const PRISMA_EVENT_REGISTRATION_REPOSITORY_TOKEN = Symbol(
  'PRISMA_EVENT_REGISTRATION_REPOSITORY_TOKEN',
);
