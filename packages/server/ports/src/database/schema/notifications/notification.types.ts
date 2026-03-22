export type NotificationChannel =
  | 'EMAIL'
  | 'SMS'
  | 'PUSH'
  | 'IN_APP'
  | 'SLACK'
  | 'TELEGRAM'
  | 'WHATSAPP';
export type NotificationStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'BOUNCED';

export interface NotificationTemplateRecord {
  id: string;
  name: string;
  slug: string;
  type: string;
  channels: NotificationChannel[];
  emailSubject?: string | null;
  emailHtml?: string | null;
  emailText?: string | null;
  smsBody?: string | null;
  pushTitle?: string | null;
  pushBody?: string | null;
  pushData?: Record<string, unknown> | null;
  inAppTitle?: string | null;
  inAppBody?: string | null;
  inAppAction?: string | null;
  slackMessage?: Record<string, unknown> | null;
  telegramMessage?: string | null;
  whatsappTemplateId?: string | null;
  whatsappParams?: Record<string, unknown> | null;
  variables: string[];
  isActive: boolean;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface UpsertNotificationTemplateInput
  extends Omit<NotificationTemplateRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

export interface NotificationDeliveryAttempt {
  attemptNumber: number;
  status: NotificationStatus;
  providerId?: string | null;
  providerResponse?: Record<string, unknown> | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  createdAt: Date;
}

export interface NotificationRecord {
  id: string;
  type: string;
  channel: NotificationChannel;
  templateId?: string | null;
  userId?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  recipientDevice?: string | null;
  recipientSlack?: string | null;
  recipientTelegram?: string | null;
  subject?: string | null;
  title?: string | null;
  body: string;
  htmlBody?: string | null;
  data?: Record<string, unknown> | null;
  orderId?: string | null;
  batchId?: string | null;
  paymentId?: string | null;
  status: NotificationStatus;
  scheduledAt?: Date | null;
  queuedAt?: Date | null;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  openedAt?: Date | null;
  clickedAt?: Date | null;
  failedAt?: Date | null;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  providerId?: string | null;
  providerResponse?: Record<string, unknown> | null;
  attempts: NotificationDeliveryAttempt[];
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationInput
  extends Omit<
    NotificationRecord,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'attempts'
    | 'retryCount'
    | 'maxRetries'
    | 'status'
  > {
  status?: NotificationStatus;
  retryCount?: number;
  maxRetries?: number;
}

export interface InAppNotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  imageUrl?: string | null;
  orderId?: string | null;
  batchId?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  isDismissed: boolean;
  dismissedAt?: Date | null;
  expiresAt?: Date | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateInAppNotificationInput
  extends Omit<
    InAppNotificationRecord,
    'id' | 'createdAt' | 'isRead' | 'readAt' | 'isDismissed' | 'dismissedAt'
  > {}

export interface PushDeviceRecord {
  id: string;
  userId: string;
  token: string;
  platform: string;
  deviceId?: string | null;
  deviceModel?: string | null;
  osVersion?: string | null;
  appVersion?: string | null;
  isActive: boolean;
  lastActiveAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertPushDeviceInput
  extends Omit<PushDeviceRecord, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> {
  isActive?: boolean;
}

export interface NotificationConfigRecord {
  id: string;
  channel: NotificationChannel;
  provider: string;
  apiKey?: string | null;
  apiSecret?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
  fromPhone?: string | null;
  slackWebhook?: string | null;
  telegramBotToken?: string | null;
  rateLimit?: number | null;
  dailyLimit?: number | null;
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertNotificationConfigInput
  extends Omit<NotificationConfigRecord, 'id' | 'createdAt' | 'updatedAt'> {}
