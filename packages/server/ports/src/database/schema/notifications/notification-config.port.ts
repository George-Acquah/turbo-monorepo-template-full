import { NotificationConfigRecord, UpsertNotificationConfigInput } from './notification.types';

export abstract class NotificationConfigStorePort {
  abstract upsert(data: UpsertNotificationConfigInput): Promise<NotificationConfigRecord>;
  abstract getByChannel(channel: string): Promise<NotificationConfigRecord | null>;
  abstract listActive(): Promise<NotificationConfigRecord[]>;
}

export const NOTIFICATION_CONFIG_STORE_TOKEN = Symbol('NOTIFICATION_CONFIG_STORE_TOKEN');
