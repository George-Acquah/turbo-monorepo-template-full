// JobLog execution status (workspace_audit.job_logs — worker/job run outcomes).
// Not the same as OutboxEventStatus/SagaStatus — this tracks a single BullMQ job
// execution for observability, independent of the domain-event pipeline.

export const JobExecutionStatus = {
  QUEUED: 'QUEUED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
} as const;

export type JobExecutionStatus = (typeof JobExecutionStatus)[keyof typeof JobExecutionStatus];
