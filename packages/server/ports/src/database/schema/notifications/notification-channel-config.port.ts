import { DatabaseTx } from '../shared';
import {
  CreateNotificationChannelConfigInput,
  NotificationChannelConfigPersistence,
  NotificationChannelConfigPersistenceQueryOptions,
} from './notification.types';

export abstract class NotificationChannelConfigRepositoryPort {
  abstract create<
    K extends keyof NotificationChannelConfigPersistence =
      keyof NotificationChannelConfigPersistence,
  >(
    data: CreateNotificationChannelConfigInput,
    tx?: DatabaseTx,
    options?: NotificationChannelConfigPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationChannelConfigPersistence, K>>;

  abstract findProvider<
    K extends keyof NotificationChannelConfigPersistence =
      keyof NotificationChannelConfigPersistence,
  >(
    channel: string,
    provider: string,
    tx?: DatabaseTx,
    options?: NotificationChannelConfigPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationChannelConfigPersistence, K> | null>;

  abstract findDefaultProvider<
    K extends keyof NotificationChannelConfigPersistence =
      keyof NotificationChannelConfigPersistence,
  >(
    channel: string,
    tx?: DatabaseTx,
    options?: NotificationChannelConfigPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationChannelConfigPersistence, K> | null>;

  abstract listProviders<
    K extends keyof NotificationChannelConfigPersistence =
      keyof NotificationChannelConfigPersistence,
  >(
    channel?: string,
    tx?: DatabaseTx,
    options?: NotificationChannelConfigPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationChannelConfigPersistence, K>[]>;

  abstract activate(id: string, tx?: DatabaseTx): Promise<void>;

  abstract deactivate(id: string, tx?: DatabaseTx): Promise<void>;

  abstract makeDefault(id: string, tx?: DatabaseTx): Promise<void>;
}

export const NOTIFICATION_CHANNEL_CONFIG_REPOSITORY_TOKEN = Symbol(
  'NOTIFICATION_CHANNEL_CONFIG_REPOSITORY_TOKEN',
);
export const PRISMA_NOTIFICATION_CHANNEL_CONFIG_REPOSITORY_TOKEN = Symbol(
  'PRISMA_NOTIFICATION_CHANNEL_CONFIG_REPOSITORY_TOKEN',
);
