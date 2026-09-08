import type {
  AuditLogDto,
  SystemEventDto,
  ApiLogDto,
  JobLogDto,
  LoginAttemptDto,
} from '@workspace/ports';
import type {
  AuditLog as PrismaAuditLog,
  SystemEvent as PrismaSystemEvent,
  ApiLog as PrismaApiLog,
  JobLog as PrismaJobLog,
  LoginAttempt as PrismaLoginAttempt,
} from '@workspace/prisma/client';

// AuditLogDto.entityType/action are plain strings (see audit.types.ts) — no
// cast needed against a closed union anymore.
export const AuditConverter = {
  toAuditLogDto(row: PrismaAuditLog): AuditLogDto {
    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      action: row.action,
      actorId: row.actorId,
      actorEmail: row.actorEmail,
      actorType: row.actorType,
      oldValues: (row.oldValues as Record<string, unknown> | null) ?? null,
      newValues: (row.newValues as Record<string, unknown> | null) ?? null,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      requestId: row.requestId,
      correlationId: row.correlationId,
      description: row.description,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      occurredAt: row.createdAt,
    };
  },

  toSystemEventDto(row: PrismaSystemEvent): SystemEventDto {
    return {
      id: row.id,
      eventType: row.eventType,
      source: row.source,
      errorMessage: row.message,
      occurredAt: row.createdAt,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    };
  },

  toApiLogDto(row: PrismaApiLog): ApiLogDto {
    return {
      id: row.id,
      method: row.method,
      path: row.path,
      statusCode: row.statusCode,
      userId: row.userId,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      requestId: row.requestId,
      durationMs: row.durationMs,
      errorMessage: row.errorMessage,
      occurredAt: row.createdAt,
    };
  },

  toJobLogDto(row: PrismaJobLog): JobLogDto {
    return {
      id: row.id,
      jobName: row.jobName,
      jobId: row.jobId,
      queueName: row.queueName,
      status: row.status,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      durationMs: row.durationMs,
      attempt: row.attempt,
      errorMessage: row.errorMessage,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt,
    };
  },

  toLoginAttemptDto(row: PrismaLoginAttempt): LoginAttemptDto {
    return {
      id: row.id,
      identifier: row.identifier,
      userId: row.userId,
      isSuccessful: row.isSuccessful,
      failureReason: row.failureReason,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      attemptedAt: row.attemptedAt,
    };
  },
};
