/**
 * Controller paths, kept in their own file (not notifications.routes.ts) so controllers can
 * import them without a cycle through notifications.module.ts → controllers →
 * notifications.routes.ts → notifications.module.ts — the same fix already applied to
 * modules/identity and modules/profiles.
 */
export const NOTIFICATIONS_CONTROLLER_PATHS = {
  NOTIFICATION_PREFERENCES: 'notification-preferences',
  NOTIFICATIONS: 'notifications',
} as const;
