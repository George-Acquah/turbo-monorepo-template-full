import {
  CommunicationPreferenceOverrideReason,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationPreferenceChannel,
  NotificationPriority,
  NotificationProvider,
  NotificationProviderChannel,
  NotificationStatus,
  NotificationTemplateChannel,
  PushDevicePlatform,
} from '@workspace/constants';
import { RepoQueryOptions } from '../types';

// Mongo-backed records (high-volume, document-shaped). Usually keyed on
// profileId — not userId — so guest-checkout notifications work before an
// auth account exists; userId is populated once the profile is claimed.
// Staff/admin recipients (identity's RBAC events) have no MemberProfile at
// all, so profileId is optional here and userId carries the record instead —
// at least one of the two must be set, enforced at the service layer
// (NotificationDispatchService), not by the Mongo schema.
export interface InAppNotificationPersistence {
  id: string;
  notificationId: string;

  profileId?: string;
  userId?: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  icon?: string;
  imageUrl?: string;
  read: boolean;
  readAt?: Date;
  archived: boolean;
  archivedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDeliveryPersistence {
  id: string;
  notificationId: string;

  provider: NotificationProvider;
  channel: NotificationProviderChannel;
  attemptNumber: number;
  providerMessageId?: string;
  status: NotificationDeliveryStatus;
  errorCode?: string;
  errorMessage?: string;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  createdAt: Date;
}

export interface NotificationPersistence {
  id: string;

  // Optional for the same reason as InAppNotificationPersistence.profileId —
  // staff/admin recipients have no MemberProfile; at least one of
  // profileId/userId must be set, enforced at the service layer.
  profileId?: string;
  userId?: string;
  category: string;
  eventType: string;
  templateKey?: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  title?: string;
  subject?: string;
  body: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: NotificationStatus;
  dedupeKey?: string;
  correlationId?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationInput extends Omit<
  NotificationPersistence,
  'id' | 'createdAt' | 'updatedAt' | 'status'
> {
  status?: NotificationStatus;
}

export type CreateInAppNotificationInput = Omit<
  InAppNotificationPersistence,
  'id' | 'createdAt' | 'read' | 'readAt' | 'archived' | 'archivedAt' | 'updatedAt'
>;

export type CreateNotificationDeliveryInput = Pick<
  NotificationDeliveryPersistence,
  'notificationId' | 'provider' | 'channel' | 'attemptNumber' | 'requestPayload'
>;

//Prisma workspace_notifications schema types (config only — records above are Mongo)

export interface NotificationTemplatePersistence {
  id: string;

  key: string;
  name: string;
  description?: string | null;
  channel: NotificationTemplateChannel;
  subject?: string | null;
  body: string;
  variables?: Record<string, unknown> | null;
  version: number;
  isActive: boolean;
  createdByUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateNotificationTemplateInput = Omit<
  NotificationTemplatePersistence,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateNotificationTemplateInput = Partial<
  Pick<
    NotificationTemplatePersistence,
    'name' | 'description' | 'subject' | 'body' | 'variables' | 'isActive'
  >
>;

//Notification Preferences

export interface NotificationPreferencePersistence {
  id: string;

  userId: string;
  channel: NotificationPreferenceChannel;
  category: string;
  enabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateNotificationPreferenceInput = Omit<
  NotificationPreferencePersistence,
  'id' | 'createdAt' | 'updatedAt'
>;

//Communication Preference Override

export interface CommunicationPreferenceOverridePersistence {
  id: string;
  category: string;
  reason: CommunicationPreferenceOverrideReason;
  forceDelivery: boolean;
  createdByUserId?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
}

export type CreateCommunicationPreferenceOverrideInput = Omit<
  CommunicationPreferenceOverridePersistence,
  'id' | 'createdAt'
>;

//Notification Channel Config

export interface NotificationChannelConfigPersistence {
  id: string;

  channel: NotificationProviderChannel;
  provider: string;
  isDefault: boolean;
  isActive: boolean;
  credentialsEncrypted: string;
  settings?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateNotificationChannelConfigInput = Omit<
  NotificationChannelConfigPersistence,
  'id' | 'createdAt' | 'updatedAt'
>;
//Push Device

export interface PushDevicePersistence {
  id: string;

  userId: string;
  platform: PushDevicePlatform;
  deviceToken: string;
  deviceId?: string | null;
  appVersion?: string | null;
  lastSeenAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RegisterPushDeviceInput = Omit<
  PushDevicePersistence,
  'id' | 'isActive' | 'lastSeenAt' | 'createdAt' | 'updatedAt'
>;

// ─────────────────────────────────────────────────────────────────────────────
// Query Options
// ─────────────────────────────────────────────────────────────────────────────
export type InAppNotificationPersistenceQueryOptions<K extends keyof InAppNotificationPersistence> =
  RepoQueryOptions<InAppNotificationPersistence, K>;

export type NotificationDeliveryPersistenceQueryOptions<
  K extends keyof NotificationDeliveryPersistence,
> = RepoQueryOptions<NotificationDeliveryPersistence, K>;

export type NotificationPersistenceQueryOptions<K extends keyof NotificationPersistence> =
  RepoQueryOptions<NotificationPersistence, K>;

export type NotificationTemplatePersistenceQueryOptions<
  K extends keyof NotificationTemplatePersistence,
> = RepoQueryOptions<NotificationTemplatePersistence, K>;

export type NotificationPreferencePersistenceQueryOptions<
  K extends keyof NotificationPreferencePersistence,
> = RepoQueryOptions<NotificationPreferencePersistence, K>;

export type CommunicationPreferenceOverridePersistenceQueryOptions<
  K extends keyof CommunicationPreferenceOverridePersistence,
> = RepoQueryOptions<CommunicationPreferenceOverridePersistence, K>;

export type NotificationChannelConfigPersistenceQueryOptions<
  K extends keyof NotificationChannelConfigPersistence,
> = RepoQueryOptions<NotificationChannelConfigPersistence, K>;

export type PushDevicePersistenceQueryOptions<K extends keyof PushDevicePersistence> =
  RepoQueryOptions<PushDevicePersistence, K>;
