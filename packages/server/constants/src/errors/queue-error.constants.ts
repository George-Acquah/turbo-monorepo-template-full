export const QueueErrorCodes = {
  QUEUE_JOB_FAILED: 'QUEUE_JOB_FAILED',
  QUEUE_NOT_FOUND: 'QUEUE_NOT_FOUND',
  QUEUE_RETRY_EXCEEDED: 'QUEUE_RETRY_EXCEEDED',
} as const;

export type QueueErrorCode = (typeof QueueErrorCodes)[keyof typeof QueueErrorCodes];
