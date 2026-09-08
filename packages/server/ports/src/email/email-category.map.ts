import type { EmailTemplate } from '@workspace/constants';
import { EmailCategory } from '@workspace/constants';

/**
 * Default template -> category mapping, used by `EmailProviderRouter` when
 * `EmailJobData.category` is not explicitly set. Templates omitted here
 * resolve to `EmailCategory.DEFAULT` at lookup time.
 */
export const EMAIL_TEMPLATE_CATEGORY_MAP: Partial<Record<EmailTemplate, EmailCategory>> = {
  'email-verification': EmailCategory.SECURITY,
  'password-reset': EmailCategory.SECURITY,
  'password-changed': EmailCategory.SECURITY,
  'two-factor-enabled': EmailCategory.SECURITY,
  'two-factor-disabled': EmailCategory.SECURITY,
  'role-assignment-assigned': EmailCategory.SECURITY,
  'role-assignment-revoked': EmailCategory.SECURITY,

  'invoice-issued': EmailCategory.PAYMENTS,
  'payment-receipt': EmailCategory.PAYMENTS,
  'payment-failed': EmailCategory.PAYMENTS,
  'refund-approved': EmailCategory.PAYMENTS,
  'refund-rejected': EmailCategory.PAYMENTS,
  'refund-failed': EmailCategory.PAYMENTS,
  'refund-succeeded': EmailCategory.PAYMENTS,
  'subscription-created': EmailCategory.PAYMENTS,
  'subscription-cancelled': EmailCategory.PAYMENTS,
  'subscription-expired': EmailCategory.PAYMENTS,
  'subscription-past-due': EmailCategory.PAYMENTS,
  'subscription-renewal-upcoming': EmailCategory.PAYMENTS,
  'access-grant-created': EmailCategory.PAYMENTS,
  'access-grant-revoked': EmailCategory.PAYMENTS,

  'course-completed': EmailCategory.EVENTS,
  'enrolment-activated': EmailCategory.EVENTS,
  'enrolment-cancelled': EmailCategory.EVENTS,
  'enrolment-revoked': EmailCategory.EVENTS,
  'event-cancelled': EmailCategory.EVENTS,
  'event-registration-confirmed': EmailCategory.EVENTS,
  'event-registration-promoted': EmailCategory.EVENTS,
  'event-registration-waitlisted': EmailCategory.EVENTS,
  'registration-cancelled': EmailCategory.EVENTS,
  'registration-reminder-due': EmailCategory.EVENTS,

  'user-welcome': EmailCategory.DEFAULT,
};
