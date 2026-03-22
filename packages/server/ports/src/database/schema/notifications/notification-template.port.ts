import { NotificationTemplateRecord, UpsertNotificationTemplateInput } from './notification.types';

export abstract class NotificationTemplateStorePort {
  abstract upsert(data: UpsertNotificationTemplateInput): Promise<NotificationTemplateRecord>;
  abstract findById(id: string): Promise<NotificationTemplateRecord | null>;
  abstract findBySlug(slug: string): Promise<NotificationTemplateRecord | null>;
  abstract listActive(): Promise<NotificationTemplateRecord[]>;
}

export const NOTIFICATION_TEMPLATE_STORE_TOKEN = Symbol('NOTIFICATION_TEMPLATE_STORE_TOKEN');
