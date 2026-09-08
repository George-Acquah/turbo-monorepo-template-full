import { NotificationStatus } from '@workspace/constants';
import {
  CreateNotificationInput,
  NotificationPersistence,
  NotificationPersistenceQueryOptions,
} from './notification.types';

export abstract class NotificationStorePort {
  abstract create<K extends keyof NotificationPersistence = keyof NotificationPersistence>(
    data: CreateNotificationInput,
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPersistence, K>>;

  abstract findById<K extends keyof NotificationPersistence = keyof NotificationPersistence>(
    id: string,
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPersistence, K> | null>;

  abstract findManyByIds<K extends keyof NotificationPersistence = keyof NotificationPersistence>(
    ids: string[],
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPersistence, K>[]>;

  abstract findPending<K extends keyof NotificationPersistence = keyof NotificationPersistence>(
    limit: number,
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPersistence, K>[]>;

  abstract updateStatus<K extends keyof NotificationPersistence = keyof NotificationPersistence>(
    id: string,
    status: NotificationStatus,
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPersistence, K>>;

  abstract cancel<K extends keyof NotificationPersistence = keyof NotificationPersistence>(
    id: string,
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPersistence, K>>;
}

export const NOTIFICATION_STORE_TOKEN = Symbol('NOTIFICATION_STORE_TOKEN');
