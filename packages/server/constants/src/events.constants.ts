/**
 * Domain Event Constants
 *
 * Centralized event type constants for the entire system.
 * Import these from @repo/constants for consistent event naming.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Payment Events
// ─────────────────────────────────────────────────────────────────────────────

export const PaymentEvents = {
  PAYMENT_INITIATED: 'payments.payment.initiated',
  PAYMENT_PROCESSING: 'payments.payment.processing',
  PAYMENT_SUCCESSFUL: 'payments.payment.successful',
  PAYMENT_COMPLETED: 'payments.payment.completed', // Alias for successful
  PAYMENT_FAILED: 'payments.payment.failed',
  PAYMENT_CANCELLED: 'payments.payment.cancelled',
  PAYMENT_EXPIRED: 'payments.payment.expired',

  // Refunds
  REFUND_REQUESTED: 'payments.refund.requested',
  REFUND_PROCESSING: 'payments.refund.processing',
  REFUND_COMPLETED: 'payments.refund.completed',
  REFUND_FAILED: 'payments.refund.failed',

  // Webhooks
  WEBHOOK_RECEIVED: 'payments.webhook.received',
  WEBHOOK_PROCESSED: 'payments.webhook.processed',
  WEBHOOK_FAILED: 'payments.webhook.failed',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Notification Events
// ─────────────────────────────────────────────────────────────────────────────

export const NotificationEvents = {
  NOTIFICATION_SCHEDULED: 'notifications.notification.scheduled',
  NOTIFICATION_SENT: 'notifications.notification.sent',
  NOTIFICATION_DELIVERED: 'notifications.notification.delivered',
  NOTIFICATION_FAILED: 'notifications.notification.failed',
  NOTIFICATION_OPENED: 'notifications.notification.opened',
  NOTIFICATION_CLICKED: 'notifications.notification.clicked',

  // Specific notification types
  FLASH_SALE_NOTIFICATION: 'notifications.flash_sale.notification',
  PRICE_DROP_NOTIFICATION: 'notifications.price_drop.notification',
  BACK_IN_STOCK_NOTIFICATION: 'notifications.back_in_stock.notification',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Search Events
// ─────────────────────────────────────────────────────────────────────────────

export const SearchEvents = {
  SEARCH_INDEX_REQUESTED: 'search.index.requested',
  SEARCH_INDEX_COMPLETED: 'search.index.completed',
  SEARCH_INDEX_FAILED: 'search.index.failed',
  SEARCH_QUERY_EXECUTED: 'search.query.executed',
  SEARCH_CLICKED: 'search.clicked',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Auth Events
// ─────────────────────────────────────────────────────────────────────────────
export const AuthEvents = {
  USER_CREATED: 'auth.user.created',
  USER_UPDATED: 'auth.user.updated',
  USER_DELETED: 'auth.user.deleted',
  USER_STATUS_CHANGED: 'auth.user.status_changed',

  SUPABASE_USER_CREATED: 'auth.supabase.user.created',
  SUPABASE_USER_DELETED: 'auth.supabase.user.deleted',

  INVITATION_CREATED: 'auth.invitation.created',
  INVITATION_CLAIMED: 'auth.invitation.claimed',
  INVITATION_EXPIRED: 'auth.invitation.expired',

  PASSWORD_RESET_REQUESTED: 'auth.user.password_reset_requested',

  ROLE_CREATED: 'auth.role.created',
  ROLE_UPDATED: 'auth.role.updated',
} as const;

export const AuditEvents = {
  AUDIT_LOG_NEEDED: 'audit.needed',
  API_LOG_NEEDED: 'api.needed',
  JOB_LOG_NEEDED: 'job.needed',
  SYSTEM_LOG_NEEDED: 'system.needed',
  LOGIN_LOG_NEEDED: 'login.needed',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// All Events Union
// ─────────────────────────────────────────────────────────────────────────────

export const AllEvents = {
  ...AuthEvents,
  ...AuditEvents,
  ...PaymentEvents,
  ...NotificationEvents,
  ...SearchEvents,
} as const;

export type EventType = (typeof AllEvents)[keyof typeof AllEvents];
