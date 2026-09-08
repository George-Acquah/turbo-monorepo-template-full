/**
 * BullMQ job names (doc 08 §2). The existing event/notification/payment/
 * reminder/file jobs kept, plus the ★ additions for the real commerce flows.
 * Dropped: sms/whatsapp/push sends, bulk student/attendance imports, search
 * index jobs, workflow sync, report/export/snapshot (school-era) — re-add per
 * feature.
 */
export const JobNames = {
  // event infrastructure
  PROCESS_DOMAIN_EVENT: 'process-domain-event',
  PROCESS_OUTBOX_BATCH: 'process-outbox-batch',
  RETRY_FAILED_EVENTS: 'retry-failed-events',
  PROCESS_DLQ_EVENT: 'process-dlq-event',

  // notifications
  DISPATCH_NOTIFICATION: 'dispatch-notification',
  SEND_EMAIL: 'send-email',
  LOG_NOTIFICATION_AUDIT: 'log-notification-audit',
  BROADCAST_CATALOG_CREATED: 'broadcast-catalog-created', // ★ cohort/masterclass creation fan-out

  // billing
  INITIATE_PAYMENT: 'initiate-payment',
  VERIFY_PAYMENT: 'verify-payment',
  PROCESS_REFUND: 'process-refund',
  PROCESS_PAYMENT_WEBHOOK: 'process-payment-webhook',
  RECONCILE_PAYMENTS: 'reconcile-payments', // ★ missed-webhook safety net
  EXPIRE_PENDING_ORDERS: 'expire-pending-orders', // ★
  RENDER_INVOICE_PDF: 'render-invoice-pdf', // ★

  // enrolments + memberships
  ACTIVATE_ENROLMENT: 'activate-enrolment', // ★
  PROVISION_ACCESS: 'provision-access', // ★
  REVOKE_ACCESS: 'revoke-access', // ★
  SCAN_SUBSCRIPTION_RENEWALS: 'scan-subscription-renewals', // ★
  PROCESS_SUBSCRIPTION_RENEWAL: 'process-subscription-renewal', // ★
  EXPIRE_ACCESS_GRANTS: 'expire-access-grants', // ★

  // live events
  SEND_EVENT_REMINDERS: 'send-event-reminders', // ★

  // indicators (TradingView invite-only access automation)
  SWEEP_INDICATOR_DRIFT: 'sweep-indicator-drift', // ★

  // scheduling
  POLL_REMINDERS: 'poll-reminders',
  EXECUTE_REMINDER: 'execute-reminder',
  DISPATCH_CRON_JOB: 'dispatch-cron-job',

  // files
  PROCESS_FILE_UPLOAD: 'process-file-upload',
  CLEANUP_ORPHANED_FILES: 'cleanup-orphaned-files',

  // profiles + infra housekeeping
  PURGE_ERASED_PROFILES: 'purge-erased-profiles', // ★ DPA erasure purge
  CLEANUP_IDEMPOTENCY_KEYS: 'cleanup-idempotency-keys', // ★
} as const;

export type JobName = (typeof JobNames)[keyof typeof JobNames];
