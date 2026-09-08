/**
 * Push Job Data — mirrors email-event.types.ts's shape/conventions.
 *
 * Unlike email/SMS/WhatsApp, push notifications are short (title + body) and
 * don't benefit from a file-based Handlebars template — `title`/`body` are
 * composed directly by the sender rather than rendered from a template file.
 * `template` is still carried on the job data for audit/logging consistency
 * with the other channels, but there's no TEMPLATE_RENDERER_TOKEN lookup.
 */

export enum PushTemplate {
  PAYMENT_RECEIPT = 'payment-receipt',
  PAYMENT_FAILED = 'payment-failed',
  REFUND_SUCCEEDED = 'refund-succeeded',
  EVENT_REGISTRATION_CONFIRMED = 'event-registration-confirmed',
  EVENT_REGISTRATION_PROMOTED = 'event-registration-promoted',
  EVENT_REGISTRATION_WAITLISTED = 'event-registration-waitlisted',
  EVENT_REGISTRATION_CANCELLED = 'event-registration-cancelled',
  EVENT_REGISTRATION_REMINDER_DUE = 'event-registration-reminder-due',
  ROLE_ASSIGNED = 'role-assigned',
  ROLE_REVOKED = 'role-revoked',
  ENROLMENT_ACTIVATED = 'enrolment-activated',
  ENROLMENT_CANCELLED = 'enrolment-cancelled',
  ENROLMENT_REVOKED = 'enrolment-revoked',
}

export enum PushPriority {
  HIGH = 1,
  NORMAL = 5,
  LOW = 10,
}

export interface BasePushData {
  deliveryId: string;
  /** FCM registration token for the target device. */
  to: string;
  template: PushTemplate;
  title: string;
  body: string;
  context: Record<string, unknown>;
  priority?: PushPriority;
  metadata?: Record<string, unknown>;
  // Optional correlation to a notification record
  notificationId?: string;
}

export interface PushJobData extends BasePushData {
  attemptNumber?: number;
  lastError?: string;
}
