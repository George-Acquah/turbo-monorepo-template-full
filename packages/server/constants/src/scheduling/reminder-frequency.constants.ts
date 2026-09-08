export const ReminderScheduleFrequency = {
  ONCE: 'ONCE',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
  CRON: 'CRON',
  INTERVAL: 'INTERVAL',
} as const;

export type ReminderScheduleFrequency =
  (typeof ReminderScheduleFrequency)[keyof typeof ReminderScheduleFrequency];

export const ReminderDispatchChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP',
  WHATSAPP: 'WHATSAPP',
} as const;

export type ReminderDispatchChannel =
  (typeof ReminderDispatchChannel)[keyof typeof ReminderDispatchChannel];

export const ReminderDispatchStatus = {
  PENDING: 'PENDING',
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
  RETRYING: 'RETRYING',
  CANCELLED: 'CANCELLED',
} as const;

export type ReminderDispatchStatus =
  (typeof ReminderDispatchStatus)[keyof typeof ReminderDispatchStatus];
