import { AuditActionType, AuditEntityType } from '@repo/types';

export interface AuditLogDto {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditActionType;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  actorType?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  changedFields?: string[] | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface SystemEventDto {
  id: string;
  eventType: string;
  eventName: string;
  source: string;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  status: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface ApiLogDto {
  id: string;
  method: string;
  path: string;
  query?: Record<string, unknown> | null;
  body?: Record<string, unknown> | null;
  headers?: Record<string, unknown> | null;
  statusCode: number;
  responseBody?: Record<string, unknown> | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  durationMs?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
}

export interface JobLogDto {
  id: string;
  jobName: string;
  jobId?: string | null;
  queue?: string | null;
  status: string;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  scheduledAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
  attempt?: number | null;
  maxAttempts?: number | null;
  nextRetryAt?: Date | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface LoginAttemptDto {
  id: string;
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
  isSuccessful: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: Record<string, unknown> | null;
  deviceFingerprint?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AuditLogInput {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditActionType;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  actorType?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  changedFields?: string[];
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SystemEventInput {
  eventType: string;
  eventName: string;
  source: string;
  entityType?: AuditEntityType | null;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  status?: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  startedAt?: Date;
  completedAt?: Date | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface ApiLogInput {
  method: string;
  path: string;
  query?: Record<string, unknown> | null;
  body?: Record<string, unknown> | null;
  headers?: Record<string, unknown> | null;
  statusCode: number;
  responseBody?: Record<string, unknown> | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  durationMs?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export interface JobLogInput {
  jobName: string;
  jobId?: string | null;
  queue?: string | null;
  status?: string;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  scheduledAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
  attempt?: number | null;
  maxAttempts?: number | null;
  nextRetryAt?: Date | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface LoginAttemptInput {
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
  isSuccessful: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: Record<string, unknown> | null;
  deviceFingerprint?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditSearchCriteria {
  startDate?: Date | null;
  endDate?: Date | null;
  entityType?: AuditEntityType | null;
  entityId?: string | null;
  actorId?: string | null;
  skip?: number;
  take?: number;
}

export interface SystemEventSearchCriteria {
  companyId?: string;
  eventType?: AuditEntityType;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}
