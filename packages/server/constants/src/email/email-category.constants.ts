/**
 * Closed catalogue of email routing categories.
 *
 * This answers "why is this email being sent" so `EmailProviderRouter`
 * (`@workspace/email`) can pick a provider per message instead of one
 * provider for the whole process. It is deliberately separate from
 * `NotificationCategory` (`../notification/notification-category.constants`):
 * that one gates member SMS/Push/WhatsApp/in-app preferences and explicitly
 * excludes email from gating, while this one only ever affects which email
 * provider sends a message and has no relationship to member preferences.
 */
export const EmailCategory = {
  SECURITY: 'security',
  PAYMENTS: 'payments',
  EVENTS: 'events',
  MARKETING: 'marketing',
  DEFAULT: 'default',
} as const;

export type EmailCategory = (typeof EmailCategory)[keyof typeof EmailCategory];

export const EMAIL_CATEGORIES = Object.values(EmailCategory);
