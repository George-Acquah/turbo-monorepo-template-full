import { IdPrefixes } from '@repo/constants';
import {
  AUDIT_COMMAND_PORT,
  AUDIT_QUERY_PORT,
  type ApiLogDto,
  type ApiLogInput,
  AuditCommandPort,
  type AuditLogDto,
  type AuditLogInput,
  AuditQueryPort,
  type AuditSearchCriteria,
  CONTEXT_TOKEN,
  type ContextPort,
  type DatabaseTx,
  type JobLogDto,
  type JobLogInput,
  type LoginAttemptDto,
  type LoginAttemptInput,
  type SystemEventDto,
  type SystemEventInput,
  type SystemEventSearchCriteria,
} from '@repo/ports';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma.service';
import { generateId } from '../../utils/generate-id';
import { resolvePrismaClient } from '../../utils/prisma-client-resolver';
import { toInputJson, toRecord } from '../../utils/prisma-mappers';

@Injectable()
export class PrismaAuditStoreAdapter implements AuditCommandPort, AuditQueryPort {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CONTEXT_TOKEN) private readonly context?: ContextPort,
  ) {}

  async createAuditLog(data: AuditLogInput, tx?: DatabaseTx): Promise<AuditLogDto> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).auditLog.create({
      data: {
        id: generateId(IdPrefixes.AUDIT_LOG),
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        actorId: data.actorId ?? null,
        actorEmail: data.actorEmail ?? null,
        actorRole: data.actorRole ?? null,
        actorType: data.actorType ?? null,
        oldValues: toInputJson(data.oldValues),
        newValues: toInputJson(data.newValues),
        changedFields: data.changedFields ?? [],
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        requestId: data.requestId ?? null,
        description: data.description ?? null,
        metadata: toInputJson(data.metadata),
      },
    });

    return this.mapAuditLog(row);
  }

  async createSystemEvent(data: SystemEventInput, tx?: DatabaseTx): Promise<SystemEventDto> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).systemEvent.create({
      data: {
        id: generateId(IdPrefixes.SYSTEM_EVENT),
        eventType: data.eventType,
        eventName: data.eventName,
        source: data.source,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        payload: toInputJson(data.payload),
        result: toInputJson(data.result),
        status: data.status ?? 'completed',
        errorCode: data.errorCode ?? null,
        errorMessage: data.errorMessage ?? null,
        startedAt: data.startedAt ?? new Date(),
        completedAt: data.completedAt ?? null,
        durationMs: data.durationMs ?? null,
        metadata: toInputJson(data.metadata),
      },
    });

    return this.mapSystemEvent(row);
  }

  async createApiLog(data: ApiLogInput, tx?: DatabaseTx): Promise<ApiLogDto> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).apiLog.create({
      data: {
        id: generateId(IdPrefixes.API_LOG),
        method: data.method,
        path: data.path,
        query: toInputJson(data.query),
        body: toInputJson(data.body),
        headers: toInputJson(data.headers),
        statusCode: data.statusCode,
        responseBody: toInputJson(data.responseBody),
        userId: data.userId ?? null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        requestId: data.requestId ?? null,
        durationMs: data.durationMs ?? 0,
        errorCode: data.errorCode ?? null,
        errorMessage: data.errorMessage ?? null,
      },
    });

    return this.mapApiLog(row);
  }

  async createJobLog(data: JobLogInput, tx?: DatabaseTx): Promise<JobLogDto> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).jobLog.create({
      data: {
        id: generateId(IdPrefixes.JOB_LOG),
        jobName: data.jobName,
        jobId: data.jobId ?? null,
        queue: data.queue ?? null,
        status: data.status ?? 'queued',
        input: toInputJson(data.input),
        output: toInputJson(data.output),
        scheduledAt: data.scheduledAt ?? null,
        startedAt: data.startedAt ?? null,
        completedAt: data.completedAt ?? null,
        durationMs: data.durationMs ?? null,
        attempt: data.attempt ?? 1,
        maxAttempts: data.maxAttempts ?? 3,
        nextRetryAt: data.nextRetryAt ?? null,
        errorCode: data.errorCode ?? null,
        errorMessage: data.errorMessage ?? null,
        metadata: toInputJson(data.metadata),
      },
    });

    return this.mapJobLog(row);
  }

  async createLoginAttempt(data: LoginAttemptInput, tx?: DatabaseTx): Promise<LoginAttemptDto> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).loginAttempt.create({
      data: {
        id: generateId(IdPrefixes.LOGIN_ATTEMPT),
        email: data.email ?? null,
        phone: data.phone ?? null,
        userId: data.userId ?? null,
        isSuccessful: data.isSuccessful,
        failureReason: data.failureReason ?? null,
        ipAddress: data.ipAddress ?? 'unknown',
        userAgent: data.userAgent ?? null,
        location: toInputJson(data.location),
        deviceFingerprint: data.deviceFingerprint ?? null,
        metadata: toInputJson(data.metadata),
      },
    });

    return this.mapLoginAttempt(row);
  }

  async findAuditLogById(id: string): Promise<AuditLogDto | null> {
    const row = await resolvePrismaClient(this.prisma, this.context).auditLog.findUnique({
      where: { id },
    });

    return row ? this.mapAuditLog(row) : null;
  }

  async searchAuditLogs(
    criteria: AuditSearchCriteria,
  ): Promise<{ total: number; items: AuditLogDto[] }> {
    const where: Prisma.AuditLogWhereInput = {
      entityType: criteria.entityType ?? undefined,
      entityId: criteria.entityId ?? undefined,
      actorId: criteria.actorId ?? undefined,
      createdAt: this.range(criteria.startDate ?? undefined, criteria.endDate ?? undefined),
    };

    const client = resolvePrismaClient(this.prisma, this.context);
    const [total, items] = await Promise.all([
      client.auditLog.count({ where }),
      client.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: criteria.skip ?? 0,
        take: criteria.take ?? 50,
      }),
    ]);

    return {
      total,
      items: items.map((row) => this.mapAuditLog(row)),
    };
  }

  async findEntityAuditHistory(entityType: string, entityId: string): Promise<AuditLogDto[]> {
    const rows = await resolvePrismaClient(this.prisma, this.context).auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.mapAuditLog(row));
  }

  async findApiLogs(criteria: {
    companyId?: string;
    path?: string;
    method?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ApiLogDto[]> {
    const rows = await resolvePrismaClient(this.prisma, this.context).apiLog.findMany({
      where: {
        path: criteria.path ?? undefined,
        method: criteria.method ?? undefined,
        createdAt: this.range(criteria.startDate, criteria.endDate),
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.mapApiLog(row));
  }

  async findSystemEvents(criteria: SystemEventSearchCriteria): Promise<SystemEventDto[]> {
    const rows = await resolvePrismaClient(this.prisma, this.context).systemEvent.findMany({
      where: {
        eventType: criteria.eventType ?? undefined,
        status: criteria.status ?? undefined,
        createdAt: this.range(criteria.startDate, criteria.endDate),
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.mapSystemEvent(row));
  }

  async findJobLogs(criteria: {
    companyId?: string;
    jobName?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<JobLogDto[]> {
    const rows = await resolvePrismaClient(this.prisma, this.context).jobLog.findMany({
      where: {
        jobName: criteria.jobName ?? undefined,
        status: criteria.status ?? undefined,
        createdAt: this.range(criteria.startDate, criteria.endDate),
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.mapJobLog(row));
  }

  async findLoginAttempts(criteria: {
    companyId?: string;
    email?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<LoginAttemptDto[]> {
    const rows = await resolvePrismaClient(this.prisma, this.context).loginAttempt.findMany({
      where: {
        email: criteria.email ?? undefined,
        userId: criteria.userId ?? undefined,
        createdAt: this.range(criteria.startDate, criteria.endDate),
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.mapLoginAttempt(row));
  }

  private range(startDate?: Date, endDate?: Date): Prisma.DateTimeFilter | undefined {
    if (!startDate && !endDate) {
      return undefined;
    }

    return {
      gte: startDate,
      lte: endDate,
    };
  }

  private mapAuditLog(row: Prisma.AuditLogGetPayload<Record<string, never>>): AuditLogDto {
    return {
      id: row.id,
      entityType: row.entityType as AuditLogDto['entityType'],
      entityId: row.entityId,
      action: row.action as AuditLogDto['action'],
      actorId: row.actorId,
      actorEmail: row.actorEmail,
      actorRole: row.actorRole,
      actorType: row.actorType,
      oldValues: toRecord(row.oldValues) ?? null,
      newValues: toRecord(row.newValues) ?? null,
      changedFields: row.changedFields,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      requestId: row.requestId,
      description: row.description,
      metadata: toRecord(row.metadata) ?? null,
      createdAt: row.createdAt,
    };
  }

  private mapSystemEvent(
    row: Prisma.SystemEventGetPayload<Record<string, never>>,
  ): SystemEventDto {
    return {
      id: row.id,
      eventType: row.eventType,
      eventName: row.eventName,
      source: row.source,
      entityType: row.entityType,
      entityId: row.entityId,
      payload: toRecord(row.payload) ?? null,
      result: toRecord(row.result) ?? null,
      status: row.status,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      durationMs: row.durationMs,
      metadata: toRecord(row.metadata) ?? null,
      createdAt: row.createdAt,
    };
  }

  private mapApiLog(row: Prisma.ApiLogGetPayload<Record<string, never>>): ApiLogDto {
    return {
      id: row.id,
      method: row.method,
      path: row.path,
      query: toRecord(row.query) ?? null,
      body: toRecord(row.body) ?? null,
      headers: toRecord(row.headers) ?? null,
      statusCode: row.statusCode,
      responseBody: toRecord(row.responseBody) ?? null,
      userId: row.userId,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      requestId: row.requestId,
      durationMs: row.durationMs,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
    };
  }

  private mapJobLog(row: Prisma.JobLogGetPayload<Record<string, never>>): JobLogDto {
    return {
      id: row.id,
      jobName: row.jobName,
      jobId: row.jobId,
      queue: row.queue,
      status: row.status,
      input: toRecord(row.input) ?? null,
      output: toRecord(row.output) ?? null,
      scheduledAt: row.scheduledAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      durationMs: row.durationMs,
      attempt: row.attempt,
      maxAttempts: row.maxAttempts,
      nextRetryAt: row.nextRetryAt,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      metadata: toRecord(row.metadata) ?? null,
      createdAt: row.createdAt,
    };
  }

  private mapLoginAttempt(
    row: Prisma.LoginAttemptGetPayload<Record<string, never>>,
  ): LoginAttemptDto {
    return {
      id: row.id,
      email: row.email,
      phone: row.phone,
      userId: row.userId,
      isSuccessful: row.isSuccessful,
      failureReason: row.failureReason,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      location: toRecord(row.location) ?? null,
      deviceFingerprint: row.deviceFingerprint,
      metadata: toRecord(row.metadata) ?? null,
      createdAt: row.createdAt,
    };
  }
}
