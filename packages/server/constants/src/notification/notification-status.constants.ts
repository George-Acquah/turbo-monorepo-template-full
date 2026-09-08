export const NotificationStatus = {
  PENDING: 'PENDING',
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  BOUNCED: 'BOUNCED',
  FAILED: 'FAILED',
  // Recorded (never silently dropped) when a marketing-class template is blocked
  // by preference/consent — see doc 09 compliance rules.
  SUPPRESSED: 'SUPPRESSED',
  READ: 'READ',
  CANCELLED: 'CANCELLED',
} as const;

export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

export const NotificationDeliveryStatus = {
  QUEUED: 'QUEUED',
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  BOUNCED: 'BOUNCED',
  RETRYING: 'RETRYING',
} as const;

export type NotificationDeliveryStatus =
  (typeof NotificationDeliveryStatus)[keyof typeof NotificationDeliveryStatus];

export const NotificationAuditAction = {
  CREATED: 'CREATED',
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  OPENED: 'OPENED',
  CLICKED: 'CLICKED',
  FAILED: 'FAILED',
  RETRIED: 'RETRIED',
  CANCELLED: 'CANCELLED',
} as const;

export type NotificationAuditAction =
  (typeof NotificationAuditAction)[keyof typeof NotificationAuditAction];

export const NotificationAuditActorType = {
  SYSTEM: 'SYSTEM',
  WORKER: 'WORKER',
  USER: 'USER',
} as const;

export type NotificationAuditActorType =
  (typeof NotificationAuditActorType)[keyof typeof NotificationAuditActorType];

export const NotificationOutboxStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
} as const;

export type NotificationOutboxStatus =
  (typeof NotificationOutboxStatus)[keyof typeof NotificationOutboxStatus];

export const NotificationCampaignStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type NotificationCampaignStatus =
  (typeof NotificationCampaignStatus)[keyof typeof NotificationCampaignStatus];

export const NotificationRecipientStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
} as const;

export type NotificationRecipientStatus =
  (typeof NotificationRecipientStatus)[keyof typeof NotificationRecipientStatus];
