export const NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP',
  WHATSAPP: 'WHATSAPP',
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

// ─── Template & Preference channel aliases ────────────────────────────────────
// These share the same value set as NotificationChannel.
// Separate names allow each table to maintain an independent type in application code.

export const NotificationTemplateChannel = NotificationChannel;
export type NotificationTemplateChannel = NotificationChannel;

export const NotificationPreferenceChannel = NotificationChannel;
export type NotificationPreferenceChannel = NotificationChannel;

// ─── Provider channel (subset — no IN_APP) ────────────────────────────────────
export const NotificationProviderChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  WHATSAPP: 'WHATSAPP',
} as const;

export type NotificationProviderChannel =
  (typeof NotificationProviderChannel)[keyof typeof NotificationProviderChannel];

// ─── Push device platform ─────────────────────────────────────────────────────
export const PushDevicePlatform = {
  IOS: 'IOS',
  ANDROID: 'ANDROID',
  WEB: 'WEB',
} as const;

export type PushDevicePlatform = (typeof PushDevicePlatform)[keyof typeof PushDevicePlatform];
