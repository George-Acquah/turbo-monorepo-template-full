import { NotificationChannel } from '@workspace/constants';
import { DatabaseTx } from '../shared';
import {
  CreateNotificationTemplateInput,
  NotificationTemplatePersistence,
  NotificationTemplatePersistenceQueryOptions,
  UpdateNotificationTemplateInput,
} from './notification.types';

export abstract class NotificationTemplateRepositoryPort {
  abstract create<
    K extends keyof NotificationTemplatePersistence = keyof NotificationTemplatePersistence,
  >(
    data: CreateNotificationTemplateInput,
    tx?: DatabaseTx,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationTemplatePersistence, K>>;

  abstract update<
    K extends keyof NotificationTemplatePersistence = keyof NotificationTemplatePersistence,
  >(
    id: string,
    data: UpdateNotificationTemplateInput,
    tx?: DatabaseTx,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationTemplatePersistence, K>>;

  abstract findById<
    K extends keyof NotificationTemplatePersistence = keyof NotificationTemplatePersistence,
  >(
    id: string,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationTemplatePersistence, K> | null>;

  abstract findLatestVersion<
    K extends keyof NotificationTemplatePersistence = keyof NotificationTemplatePersistence,
  >(
    tenantId: string | null,
    key: string,
    channel: NotificationChannel,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationTemplatePersistence, K> | null>;

  abstract findBySlug<
    K extends keyof NotificationTemplatePersistence = keyof NotificationTemplatePersistence,
  >(
    slug: string,
    tenantId: string | null,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationTemplatePersistence, K> | null>;

  abstract list<
    K extends keyof NotificationTemplatePersistence = keyof NotificationTemplatePersistence,
  >(
    tenantId: string,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationTemplatePersistence, K>[]>;

  abstract activate(id: string, tx?: DatabaseTx): Promise<void>;

  abstract deactivate(id: string, tx?: DatabaseTx): Promise<void>;
}

export const NOTIFICATION_TEMPLATE_REPOSITORY_TOKEN = Symbol(
  'NOTIFICATION_TEMPLATE_REPOSITORY_TOKEN',
);
export const PRISMA_NOTIFICATION_TEMPLATE_REPOSITORY_TOKEN = Symbol(
  'PRISMA_NOTIFICATION_TEMPLATE_REPOSITORY_TOKEN',
);
