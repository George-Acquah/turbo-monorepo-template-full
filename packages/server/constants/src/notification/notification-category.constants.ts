/**
 * Closed catalogue of notification categories.
 *
 * `NotificationPreference.category` is a free-form `String` in the schema, and dispatch treats it
 * as an opaque key — this list is the contract for what a *member* may configure, not a database
 * constraint. Event handlers pass these same values (see
 * `modules/notifications/src/infrastructure/event-handlers/`); adding a handler in a new category
 * means adding it here too, or it won't be togglable in self-service.
 */
export const NotificationCategory = {
  BILLING: 'billing',
  EVENTS: 'events',
  IDENTITY: 'identity',
  PROFILES: 'profiles',
  LEARNING: 'learning',
  CATALOG: 'catalog',
} as const;

export type NotificationCategory = (typeof NotificationCategory)[keyof typeof NotificationCategory];

export const NOTIFICATION_CATEGORIES = Object.values(NotificationCategory);

/** Member-facing copy for each category, so the UI isn't rendering raw keys. */
export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  [NotificationCategory.BILLING]: 'Billing & payments',
  [NotificationCategory.EVENTS]: 'Live sessions & events',
  [NotificationCategory.IDENTITY]: 'Account & security',
  [NotificationCategory.PROFILES]: 'Profile & onboarding',
  [NotificationCategory.LEARNING]: 'Courses & learning progress',
  [NotificationCategory.CATALOG]: 'New cohorts & masterclasses',
};

/**
 * Channels a member may actually toggle.
 *
 * EMAIL is deliberately absent. `NotificationDispatchService` dispatches email unconditionally —
 * it never consults `NotificationPreference` for that channel (only IN_APP, SMS, PUSH and
 * WHATSAPP are gated). Offering an email switch would be a control that silently does nothing,
 * and suppressing receipts or security mail is not something to expose casually. Marketing email
 * has its own opt-out via `MemberProfile.marketingOptIn` + `ConsentRecord`.
 */
export const CONFIGURABLE_NOTIFICATION_CHANNELS = ['IN_APP', 'SMS', 'PUSH', 'WHATSAPP'] as const;

export type ConfigurableNotificationChannel = (typeof CONFIGURABLE_NOTIFICATION_CHANNELS)[number];
