// ─── Outbox / Event Infrastructure ───────────────────────────────────────────
export const OutboxEventStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
  DEAD_LETTERED: 'DEAD_LETTERED',
} as const;

export type OutboxEventStatus = (typeof OutboxEventStatus)[keyof typeof OutboxEventStatus];

export const DLQEventStatus = {
  UNRESOLVED: 'UNRESOLVED',
  RETRYING: 'RETRYING',
  RESOLVED: 'RESOLVED',
  IGNORED: 'IGNORED',
} as const;

export type DLQEventStatus = (typeof DLQEventStatus)[keyof typeof DLQEventStatus];

export const SagaStatus = {
  STARTED: 'STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  COMPENSATING: 'COMPENSATING',
  COMPENSATED: 'COMPENSATED',
  FAILED: 'FAILED',
} as const;

export type SagaStatus = (typeof SagaStatus)[keyof typeof SagaStatus];

export const IdempotencyStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type IdempotencyStatus = (typeof IdempotencyStatus)[keyof typeof IdempotencyStatus];

// ─── Audit ────────────────────────────────────────────────────────────────────
export const AuditActorType = {
  USER: 'user',
  SYSTEM: 'system',
  API: 'api',
  WORKER: 'worker',
} as const;

export type AuditActorType = (typeof AuditActorType)[keyof typeof AuditActorType];

// ─── Analytics ────────────────────────────────────────────────────────────────
export const ReportExportStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
} as const;

export type ReportExportStatus = (typeof ReportExportStatus)[keyof typeof ReportExportStatus];

export const ReportExportFormat = {
  CSV: 'CSV',
  XLSX: 'XLSX',
  PDF: 'PDF',
  JSON: 'JSON',
} as const;

export type ReportExportFormat = (typeof ReportExportFormat)[keyof typeof ReportExportFormat];
