export const NotificationErrorCodes = {
  NOTIFICATION_SEND_FAILED: 'NOTIFICATION_SEND_FAILED',
  NOTIFICATION_CHANNEL_DISABLED: 'NOTIFICATION_CHANNEL_DISABLED',
  NOTIFICATION_RECIPIENT_NOT_FOUND: 'NOTIFICATION_RECIPIENT_NOT_FOUND',
  /** Channel is outside CONFIGURABLE_NOTIFICATION_CHANNELS — e.g. EMAIL, which dispatch sends
   *  unconditionally, so a stored preference for it would never be honoured. */
  NOTIFICATION_CHANNEL_NOT_CONFIGURABLE: 'NOTIFICATION_CHANNEL_NOT_CONFIGURABLE',
  /** Category is outside the NotificationCategory catalogue. */
  NOTIFICATION_CATEGORY_UNKNOWN: 'NOTIFICATION_CATEGORY_UNKNOWN',
  NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
  /** Caller's userId/profileId doesn't own the in-app notification row (IDOR guard on
   *  mark-read/archive — the store port's markRead/archive take only an id, no owner filter). */
  NOTIFICATION_ACCESS_DENIED: 'NOTIFICATION_ACCESS_DENIED',
} as const;

export type NotificationErrorCode = (typeof NotificationErrorCodes)[keyof typeof NotificationErrorCodes];
