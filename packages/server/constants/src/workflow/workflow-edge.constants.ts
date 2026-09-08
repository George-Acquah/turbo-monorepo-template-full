// ─── Workflow Action & Audit Logs ─────────────────────────────────────────────
export const WorkflowActionType = {
  INSTANCE_STARTED: 'INSTANCE_STARTED',
  STEP_STARTED: 'STEP_STARTED',
  STEP_COMPLETED: 'STEP_COMPLETED',
  STEP_FAILED: 'STEP_FAILED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_APPROVED: 'TASK_APPROVED',
  TASK_REJECTED: 'TASK_REJECTED',
  TASK_ESCALATED: 'TASK_ESCALATED',
  DELAY_STARTED: 'DELAY_STARTED',
  DELAY_COMPLETED: 'DELAY_COMPLETED',
  ACTION_EXECUTED: 'ACTION_EXECUTED',
  NOTIFICATION_SENT: 'NOTIFICATION_SENT',
  REMINDER_CREATED: 'REMINDER_CREATED',
  INSTANCE_COMPLETED: 'INSTANCE_COMPLETED',
  INSTANCE_REJECTED: 'INSTANCE_REJECTED',
  INSTANCE_CANCELLED: 'INSTANCE_CANCELLED',
  INSTANCE_TIMED_OUT: 'INSTANCE_TIMED_OUT',
  INSTANCE_FAILED: 'INSTANCE_FAILED',
} as const;

export type WorkflowActionType = (typeof WorkflowActionType)[keyof typeof WorkflowActionType];

export const WorkflowActorType = {
  USER: 'user',
  SYSTEM: 'system',
  WORKER: 'worker',
  API: 'api',
} as const;

export type WorkflowActorType = (typeof WorkflowActorType)[keyof typeof WorkflowActorType];
