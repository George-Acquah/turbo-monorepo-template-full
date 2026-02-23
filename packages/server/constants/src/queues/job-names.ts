/**
 * Job names shared across BullMQ workers.
 */
export const JobNames = {
  // Domain events
  PROCESS_DOMAIN_EVENT: 'process-domain-event',

  // Outbox
  PROCESS_OUTBOX_BATCH: 'process-outbox-batch',
  RETRY_FAILED_EVENTS: 'retry-failed-events',

  // Notifications
  DISPATCH_NOTIFICATION: 'dispatch-notification',
  SEND_EMAIL: 'send-email',
  SEND_SMS: 'send-sms',
  SEND_PUSH: 'send-push',
  SEND_IN_APP: 'send-in-app',

  // Payments
  INITIATE_PAYMENT: 'initiate-payment',
  VERIFY_PAYMENT: 'verify-payment',
  PROCESS_REFUND: 'process-refund',

  // Search
  INDEX_DOCUMENT: 'index-document',
  REMOVE_DOCUMENT: 'remove-document',
  REINDEX_ALL: 'reindex-all',

  // Dead letter
  PROCESS_DLQ_EVENT: 'process-dlq-event',

  // Webhooks
  PROCESS_WEBHOOK: 'process-webhook',
} as const;

export type JobName = (typeof JobNames)[keyof typeof JobNames];
