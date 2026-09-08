export const QueuePriorityLevels = {
  CRITICAL: 1,
  HIGH: 2,
  STANDARD: 3,
  LOW: 4,
} as const;

export type QueuePriorityLevel = (typeof QueuePriorityLevels)[keyof typeof QueuePriorityLevels];
