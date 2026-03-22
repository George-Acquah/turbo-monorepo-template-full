import { CreateNotificationInput, NotificationDeliveryAttempt, NotificationRecord } from './notification.types';

export abstract class NotificationDeliveryStorePort {
  abstract create(data: CreateNotificationInput): Promise<NotificationRecord>;
  abstract findById(id: string): Promise<NotificationRecord | null>;
  abstract findPending(limit: number): Promise<NotificationRecord[]>;
  abstract markQueued(id: string, queuedAt?: Date): Promise<NotificationRecord>;
  abstract recordAttempt(id: string, attempt: NotificationDeliveryAttempt): Promise<NotificationRecord>;
  abstract markSent(
    id: string,
    data?: { providerId?: string | null; providerResponse?: Record<string, unknown> | null; sentAt?: Date },
  ): Promise<NotificationRecord>;
  abstract markDelivered(
    id: string,
    data?: { deliveredAt?: Date; providerResponse?: Record<string, unknown> | null },
  ): Promise<NotificationRecord>;
  abstract markFailed(
    id: string,
    data: {
      failureCode?: string | null;
      failureMessage?: string | null;
      nextRetryAt?: Date | null;
      failedAt?: Date;
      providerResponse?: Record<string, unknown> | null;
    },
  ): Promise<NotificationRecord>;
}

export const NOTIFICATION_DELIVERY_STORE_TOKEN = Symbol('NOTIFICATION_DELIVERY_STORE_TOKEN');
