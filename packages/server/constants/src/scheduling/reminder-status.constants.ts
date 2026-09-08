export const ReminderStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export type ReminderStatus = (typeof ReminderStatus)[keyof typeof ReminderStatus];

export const ReminderPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type ReminderPriority = (typeof ReminderPriority)[keyof typeof ReminderPriority];

export const ReminderCategory = {
  FEES: 'FEES',
  ACADEMICS: 'ACADEMICS',
  ATTENDANCE: 'ATTENDANCE',
  HR: 'HR',
  COMMUNICATION: 'COMMUNICATION',
  SYSTEM: 'SYSTEM',
  CUSTOM: 'CUSTOM',
} as const;

export type ReminderCategory = (typeof ReminderCategory)[keyof typeof ReminderCategory];

export const ReminderTriggerType = {
  ONCE: 'ONCE',
  RECURRING: 'RECURRING',
  CRON: 'CRON',
  EVENT: 'EVENT',
} as const;

export type ReminderTriggerType = (typeof ReminderTriggerType)[keyof typeof ReminderTriggerType];

export const ReminderTargetType = {
  USER: 'USER',
  STUDENT: 'STUDENT',
  GUARDIAN: 'GUARDIAN',
  STAFF: 'STAFF',
  SCHOOL: 'SCHOOL',
  ORGANIZATION: 'ORGANIZATION',
  CLASS_LEVEL: 'CLASS_LEVEL',
  CLASS_ROOM: 'CLASS_ROOM',
  INVOICE: 'INVOICE',
  PAYMENT: 'PAYMENT',
  ENROLLMENT: 'ENROLLMENT',
  ACADEMIC_TERM: 'ACADEMIC_TERM',
  EXAM: 'EXAM',
  COURSE: 'COURSE',
  CUSTOM_SEGMENT: 'CUSTOM_SEGMENT',
} as const;

export type ReminderTargetType = (typeof ReminderTargetType)[keyof typeof ReminderTargetType];
