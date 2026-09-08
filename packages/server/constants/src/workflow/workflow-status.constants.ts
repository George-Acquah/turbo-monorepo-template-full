// ─── Workflow Definition & Version ───────────────────────────────────────────
export const WorkflowStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus];

// Alias — workflow_versions.status uses the same values
export const WorkflowVersionStatus = WorkflowStatus;
export type WorkflowVersionStatus = WorkflowStatus;

// ─── Workflow Instances ───────────────────────────────────────────────────────
export const WorkflowInstanceStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  WAITING_APPROVAL: 'WAITING_APPROVAL',
  WAITING_DELAY: 'WAITING_DELAY',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
  TIMED_OUT: 'TIMED_OUT',
} as const;

export type WorkflowInstanceStatus =
  (typeof WorkflowInstanceStatus)[keyof typeof WorkflowInstanceStatus];

// ─── Step Executions ──────────────────────────────────────────────────────────
export const WorkflowStepExecutionStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
  WAITING: 'WAITING',
} as const;

export type WorkflowStepExecutionStatus =
  (typeof WorkflowStepExecutionStatus)[keyof typeof WorkflowStepExecutionStatus];

// ─── Tasks (Human Approvals) ──────────────────────────────────────────────────
export const WorkflowTaskStatus = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REQUEST_CHANGES: 'REQUEST_CHANGES',
  ESCALATED: 'ESCALATED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export type WorkflowTaskStatus = (typeof WorkflowTaskStatus)[keyof typeof WorkflowTaskStatus];

export const WorkflowTaskDecision = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REQUEST_CHANGES: 'REQUEST_CHANGES',
} as const;

export type WorkflowTaskDecision =
  (typeof WorkflowTaskDecision)[keyof typeof WorkflowTaskDecision];
