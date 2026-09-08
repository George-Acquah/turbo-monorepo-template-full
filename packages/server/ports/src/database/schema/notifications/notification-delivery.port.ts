import { NotificationDeliveryStatus } from '@workspace/constants';
import {
  CreateNotificationDeliveryInput,
  NotificationDeliveryPersistence,
  NotificationDeliveryPersistenceQueryOptions,
} from './notification.types';

export interface NotificationDeliveryMutationResult {
  tenantId: string;
  notificationId: string;
}

export abstract class NotificationDeliveryStorePort {
  abstract create<
    K extends keyof NotificationDeliveryPersistence = keyof NotificationDeliveryPersistence,
  >(
    data: CreateNotificationDeliveryInput,
    options?: NotificationDeliveryPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationDeliveryPersistence, K>>;

  abstract findById<
    K extends keyof NotificationDeliveryPersistence = keyof NotificationDeliveryPersistence,
  >(
    id: string,
    options?: NotificationDeliveryPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationDeliveryPersistence, K> | null>;

  abstract findByNotification<
    K extends keyof NotificationDeliveryPersistence = keyof NotificationDeliveryPersistence,
  >(
    notificationId: string,
    options?: NotificationDeliveryPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationDeliveryPersistence, K>[]>;

  abstract findPendingAndFailedByNotification<
    K extends keyof NotificationDeliveryPersistence = keyof NotificationDeliveryPersistence,
  >(
    notificationId: string,
    options?: NotificationDeliveryPersistenceQueryOptions<K>,
  ): Promise<{
    pending: Pick<NotificationDeliveryPersistence, K>[];
    failed: Pick<NotificationDeliveryPersistence, K>[];
  }>;

  abstract markQueued(deliveryId: string): Promise<void>;

  abstract markSent(
    deliveryId: string,
    data: {
      providerMessageId?: string;
      responsePayload?: Record<string, unknown>;
      sentAt?: Date;
    },
  ): Promise<NotificationDeliveryMutationResult | null>;

  abstract markDelivered(
    deliveryId: string,
    data?: {
      deliveredAt?: Date;
      responsePayload?: Record<string, unknown>;
    },
  ): Promise<NotificationDeliveryMutationResult | null>;

  abstract markFailed(
    deliveryId: string,
    data: {
      errorCode?: string;
      errorMessage?: string;
      responsePayload?: Record<string, unknown>;
      failedAt?: Date;
    },
  ): Promise<NotificationDeliveryMutationResult | null>;

  abstract updateStatus(deliveryId: string, status: NotificationDeliveryStatus): Promise<void>;
}

export const NOTIFICATION_DELIVERY_STORE_TOKEN = Symbol('NOTIFICATION_DELIVERY_STORE_TOKEN');
