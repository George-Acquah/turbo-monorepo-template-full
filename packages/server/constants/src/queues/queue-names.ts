/**
 * Queue names shared across the platform.
 *
 * Keep values stable and kebab-case because they are persisted in Redis/BullMQ.
 */
export const QueueNames = {
  // Event processing queues
  DOMAIN_EVENTS: 'domain-events',
  OUTBOX_PROCESSOR: 'outbox-processor',

  // Event-specific queues
  PAYMENT_EVENTS: 'payment-events',
  NOTIFICATION_EVENTS: 'notification-events',
  AUDIT_EVENTS: 'audit-events',
  USER_EVENTS: 'user-events',
  AUTH_EVENTS: 'auth-events',

  // Notifications
  NOTIFICATIONS: 'notifications',
  NOTIFICATIONS_DISPATCH: 'notifications-dispatch',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH_NOTIFICATIONS: 'push-notifications',
  EMAIL_SMTP: 'email-smtp',
  EMAIL_SES: 'email-ses',
  EMAIL_SENDGRID: 'email-sendgrid',

  // Payments
  PAYMENT_PROCESSING: 'payment-processing',
  REFUND_PROCESSING: 'refund-processing',

  // Search
  SEARCH_INDEXING: 'search-indexing',

  // Scheduled jobs
  SCHEDULED_JOBS: 'scheduled-jobs',

  // Infrastructure
  DEAD_LETTER: 'dead-letter',
  WEBHOOKS: 'webhooks',
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];
