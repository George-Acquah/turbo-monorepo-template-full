/**
 * Recurrence types for future calendar/event-driven scheduling.
 * Placeholder — extends ReminderScheduleFrequency when needed.
 */
export const RecurrenceType = {
  NONE: 'NONE',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
  CUSTOM: 'CUSTOM',
} as const;

export type RecurrenceType = (typeof RecurrenceType)[keyof typeof RecurrenceType];
