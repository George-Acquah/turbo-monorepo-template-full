export const ReminderExecutionStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
  CANCELLED: 'CANCELLED',
} as const;

export type ReminderExecutionStatus =
  (typeof ReminderExecutionStatus)[keyof typeof ReminderExecutionStatus];
