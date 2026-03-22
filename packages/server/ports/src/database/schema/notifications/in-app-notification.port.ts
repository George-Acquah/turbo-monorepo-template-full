import { CreateInAppNotificationInput, InAppNotificationRecord } from './notification.types';

export abstract class InAppNotificationStorePort {
  abstract create(data: CreateInAppNotificationInput): Promise<InAppNotificationRecord>;
  abstract listForUser(userId: string, options?: { unreadOnly?: boolean }): Promise<InAppNotificationRecord[]>;
  abstract markRead(id: string, readAt?: Date): Promise<void>;
  abstract dismiss(id: string, dismissedAt?: Date): Promise<void>;
}

export const IN_APP_NOTIFICATION_STORE_TOKEN = Symbol('IN_APP_NOTIFICATION_STORE_TOKEN');
