import { DatabaseTx } from '../shared';
import {
  CreateNotificationPreferenceInput,
  NotificationPreferencePersistence,
  NotificationPreferencePersistenceQueryOptions,
} from './notification.types';

export abstract class NotificationPreferenceRepositoryPort {
  abstract create<
    K extends keyof NotificationPreferencePersistence = keyof NotificationPreferencePersistence,
  >(
    data: CreateNotificationPreferenceInput,
    tx?: DatabaseTx,
    options?: NotificationPreferencePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPreferencePersistence, K>>;

  abstract upsert<
    K extends keyof NotificationPreferencePersistence = keyof NotificationPreferencePersistence,
  >(
    data: CreateNotificationPreferenceInput,
    tx?: DatabaseTx,
    options?: NotificationPreferencePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPreferencePersistence, K>>;

  abstract findPreference<
    K extends keyof NotificationPreferencePersistence = keyof NotificationPreferencePersistence,
  >(
    userId: string,
    category: string,
    channel: string,
    tx?: DatabaseTx,
    options?: NotificationPreferencePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPreferencePersistence, K> | null>;

  abstract listUserPreferences<
    K extends keyof NotificationPreferencePersistence = keyof NotificationPreferencePersistence,
  >(
    userId: string,
    tx?: DatabaseTx,
    options?: NotificationPreferencePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPreferencePersistence, K>[]>;

  abstract enable(id: string, tx?: DatabaseTx): Promise<void>;

  abstract disable(id: string, tx?: DatabaseTx): Promise<void>;
}

export const NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN = Symbol(
  'NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN',
);
export const PRISMA_NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN = Symbol(
  'PRISMA_NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN',
);
