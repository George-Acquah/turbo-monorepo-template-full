import { QueueNames } from './queue-names';

export const EventsOwnedQueues = [
  QueueNames.DOMAIN_EVENTS,
  QueueNames.OUTBOX_PROCESSOR,
  QueueNames.DEAD_LETTER,
] as const;

export const NotificationsOwnedQueues = [
  QueueNames.NOTIFICATION_EVENTS,
  QueueNames.NOTIFICATIONS_DISPATCH,
  QueueNames.EMAIL_SMTP,
  QueueNames.EMAIL_SES,
  QueueNames.EMAIL_SENDGRID,
  QueueNames.SMS,
  QueueNames.PUSH_NOTIFICATIONS,
] as const;

export const PaymentsOwnedQueues = [
  QueueNames.PAYMENT_EVENTS,
  QueueNames.PAYMENT_PROCESSING,
  QueueNames.REFUND_PROCESSING,
  QueueNames.WEBHOOKS,
] as const;

export const UsersOwnedQueues = [QueueNames.USER_EVENTS] as const;
// Backward-compatible alias
export const AuthOwnedQueues = UsersOwnedQueues;

export const AuditOwnedQueues = [QueueNames.AUDIT_EVENTS] as const;

export const SearchOwnedQueues = [QueueNames.SEARCH_INDEXING] as const;
