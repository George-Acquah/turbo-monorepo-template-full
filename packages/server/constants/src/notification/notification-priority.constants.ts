export const NotificationPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];

export const NotificationProvider = {
  RESEND: 'RESEND',
  SES: 'SES',
  SMTP: 'SMTP',
  MAILGUN: 'MAILGUN',
  TWILIO: 'TWILIO',
  VONAGE: 'VONAGE',
  FCM: 'FCM',
  APNS: 'APNS',
} as const;

export type NotificationProvider = (typeof NotificationProvider)[keyof typeof NotificationProvider];

export const CommunicationPreferenceOverrideReason = {
  COMPLIANCE: 'COMPLIANCE',
  FINANCIAL: 'FINANCIAL',
  LEGAL: 'LEGAL',
  SECURITY: 'SECURITY',
  SYSTEM: 'SYSTEM',
} as const;

export type CommunicationPreferenceOverrideReason =
  (typeof CommunicationPreferenceOverrideReason)[keyof typeof CommunicationPreferenceOverrideReason];
