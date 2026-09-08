import type { EventSeverity, SystemEventSource } from '@workspace/constants';

/**
 * `entityType`/`action` are plain strings, not the closed `AuditEntityType`/
 * `AuditActionType` unions — the Prisma columns themselves are unconstrained
 * free text (only `actor_type` has a DB check constraint). A generic
 * event-driven audit consumer (see modules/audit) stores the real
 * `aggregateType`/`eventType` values directly; a producing use-case doing an
 * inline write can still pass `AuditEntityType.X`/`AuditActionType.X` values
 * — those constants remain the recommended vocabulary, just not enforced by
 * the type. `correlationId` mirrors the envelope's `trace.correlationId`
 * (the business-transaction id), distinct from `requestId`.
 */
export interface AuditLogDto {
  id: string;

  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  actorEmail?: string | null;
  actorType?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt: Date;
}

export interface SystemEventDto {
  id: string;

  eventType: string;
  source: string;
  errorMessage?: string | null;
  occurredAt: Date;
  metadata?: Record<string, unknown> | null;
}

export interface ApiLogDto {
  id: string;

  method: string;
  path: string;

  statusCode: number;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  occurredAt: Date;
}

export interface JobLogDto {
  id: string;

  jobName: string;
  jobId?: string | null;
  queueName?: string | null;
  status: string;

  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
  attempt?: number | null;

  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface LoginAttemptDto {
  id: string;
  identifier: string;
  userId?: string | null;
  isSuccessful: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  attemptedAt: Date;
}

export interface AuditLogInput {
  entityType: string;
  entityId: string;

  action: string;
  actorId?: string | null;
  actorEmail?: string | null;
  actorType?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  occurredAt?: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SystemEventInput {
  source: string;
  eventType: string;
  severity: EventSeverity;

  message?: string | null;
  occurredAt?: Date;

  metadata?: Record<string, unknown> | null;
}

export interface ApiLogInput {
  method: string;
  path: string;

  statusCode: number;
  durationMs?: number | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  occurredAt: Date;
  errorMessage?: string | null;
}

export interface JobLogInput {
  queueName: string;
  jobName: string;
  jobId?: string | null;
  status?: string;

  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
  attempt?: number | null;

  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface LoginAttemptInput {
  identifier: string;
  userId?: string | null;
  isSuccessful: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;

  attemptedAt: Date;
}

export interface AuditSearchCriteria {
  startDate?: Date | null;
  endDate?: Date | null;
  entityType?: string | null;
  entityId?: string | null;
  actorId?: string | null;
  correlationId?: string | null;
  skip?: number;
  take?: number;
}

export interface SystemEventSearchCriteria {
  eventType?: string;
  source?: SystemEventSource;
  startDate?: Date;
  endDate?: Date;
}
