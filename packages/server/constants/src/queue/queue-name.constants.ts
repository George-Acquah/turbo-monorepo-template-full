/**
 * BullMQ queue names (doc 08 §1). One queue per bounded context for domain
 * event fan-out, plus event-infra and work queues. Dropped as dormant:
 * academics/hr/tenancy/curriculum/fees/search/sms/whatsapp/push/bulk-import
 * (school-era) — re-add when a feature needs them.
 */
export const QueueNames = {
  // event infrastructure
  DOMAIN_EVENTS: 'workspace.events.domain',
  OUTBOX_PROCESSOR: 'workspace.events.outbox.processor',
  DEAD_LETTER: 'workspace.events.dlq',
  WATCHDOG_QUEUE: 'workspace.global.watchdog',

  // domain event fan-out (one per bounded context)
  AUTH_EVENTS: 'workspace.auth.events',
  PROFILES_EVENTS: 'workspace.profiles.events',
  CATALOG_EVENTS: 'workspace.catalog.events',
  ENROLMENTS_EVENTS: 'workspace.enrolments.events',
  BILLING_EVENTS: 'workspace.billing.events',
  MEMBERSHIPS_EVENTS: 'workspace.memberships.events',
  LEARNING_EVENTS: 'workspace.learning.events',
  EVENTS_EVENTS: 'workspace.liveevents.events', // 'liveevents' avoids events.events
  NOTIFICATIONS_EVENTS: 'workspace.notifications.events',
  FILES_EVENTS: 'workspace.files.events',
  AUDIT_EVENTS: 'workspace.audit.events',
  INDICATORS_EVENTS: 'workspace.indicators.events',

  // work queues
  PAYMENT_PROCESSING: 'workspace.billing.processing',
  PAYMENT_WEBHOOKS: 'workspace.billing.webhooks',
  REFUND_PROCESSING: 'workspace.billing.refund',
  EMAIL_QUEUE: 'workspace.notifications.email',
  NOTIFICATIONS_DISPATCH: 'workspace.notifications.dispatch',
  SCHEDULED_JOBS: 'workspace.scheduling.jobs',
  REMINDER_EXECUTION: 'workspace.scheduling.reminder.execution',
  FILE_PROCESSING: 'workspace.files.processing',
  // Own queue, not SCHEDULED_JOBS: `createQueueConsumer`'s generated
  // consumer dispatches every job on a queue to one processor regardless of
  // job name (`QueueJobProcessor` never sees the job name, only `data`) —
  // modules/memberships already owns SCHEDULED_JOBS' one processor
  // (ScanSubscriptionRenewalsProcessor), so a second, different job type
  // needs its own queue rather than colliding on that one.
  FILE_CLEANUP: 'workspace.files.cleanup',
  // Same reasoning — own queue for SEND_EVENT_REMINDERS, not SCHEDULED_JOBS
  // or FILE_CLEANUP (both already owned by other contexts' processors).
  EVENT_REMINDERS: 'workspace.liveevents.reminders',
  // Same reasoning again — own queue for the periodic indicators drift sweep
  // (SWEEP_INDICATOR_DRIFT), not SCHEDULED_JOBS/FILE_CLEANUP/EVENT_REMINDERS.
  INDICATORS_SWEEP: 'workspace.indicators.sweep',
  // Own queue for BROADCAST_CATALOG_CREATED (cohort/masterclass creation
  // "notify every other member" fan-out) — same one-processor-per-queue
  // reasoning as FILE_CLEANUP/EVENT_REMINDERS/INDICATORS_SWEEP above.
  NOTIFICATIONS_BROADCAST: 'workspace.notifications.broadcast',
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];
