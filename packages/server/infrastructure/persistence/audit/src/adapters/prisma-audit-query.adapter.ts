import { Inject, Injectable } from '@nestjs/common';
import {
  AuditQueryPort,
  type AuditLogDto,
  type AuditSearchCriteria,
  type ApiLogDto,
  type SystemEventDto,
  type SystemEventSearchCriteria,
  type JobLogDto,
  type LoginAttemptDto,
} from '@workspace/ports';
import type { DatabasePagination, DatabaseTimeRange } from '@workspace/ports';
import { toSkipTake } from '@workspace/databases-core';
import { PrismaService, PRISMA_CLIENT_TOKEN } from '@workspace/prisma';
import type {
  AuditLog as PrismaAuditLog,
  ApiLog as PrismaApiLog,
  SystemEvent as PrismaSystemEvent,
  JobLog as PrismaJobLog,
  LoginAttempt as PrismaLoginAttempt,
} from '@workspace/prisma/client';
import { AuditConverter } from '../converter/audit.converter';

/**
 * Hard bounds for every audit read.
 *
 * These are the largest and most sensitive tables on the platform (7-year
 * retention per audit.prisma), so no read here may be unbounded — an absent
 * `take` previously meant Prisma returned the entire table. Enforced in the
 * query layer rather than trusting each caller's DTO.
 */
const AUDIT_PAGE = { defaultTake: 20, maxTake: 100 } as const;

@Injectable()
export class PrismaAuditQueryAdapter implements AuditQueryPort {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  async findAuditLogById(id: string): Promise<AuditLogDto | null> {
    const row = await this.prisma.auditLog.findUnique({ where: { id } });
    return row ? AuditConverter.toAuditLogDto(row) : null;
  }

  async searchAuditLogs(
    criteria: AuditSearchCriteria,
  ): Promise<{ total: number; items: AuditLogDto[] }> {
    const where = {
      entityType: criteria.entityType ?? undefined,
      entityId: criteria.entityId ?? undefined,
      actorId: criteria.actorId ?? undefined,
      correlationId: criteria.correlationId ?? undefined,
      createdAt:
        criteria.startDate || criteria.endDate
          ? { gte: criteria.startDate ?? undefined, lte: criteria.endDate ?? undefined }
          : undefined,
    };
    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake({ skip: criteria.skip, take: criteria.take }, AUDIT_PAGE),
      }),
    ]);
    return { total, items: rows.map((row: PrismaAuditLog) => AuditConverter.toAuditLogDto(row)) };
  }

  async findEntityAuditHistory(
    entityType: string,
    entityId: string,
    pagination?: DatabasePagination,
  ): Promise<AuditLogDto[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      ...toSkipTake(pagination, AUDIT_PAGE),
    });
    return rows.map((row: PrismaAuditLog) => AuditConverter.toAuditLogDto(row));
  }

  async findApiLogs(
    criteria: DatabaseTimeRange & { path?: string; method?: string } & DatabasePagination,
  ): Promise<ApiLogDto[]> {
    const rows = await this.prisma.apiLog.findMany({
      where: {
        path: criteria.path ?? undefined,
        method: criteria.method ?? undefined,
        createdAt:
          criteria.startDate || criteria.endDate
            ? { gte: criteria.startDate ?? undefined, lte: criteria.endDate ?? undefined }
            : undefined,
      },
      orderBy: { createdAt: 'desc' },
      ...toSkipTake(criteria, AUDIT_PAGE),
    });
    return rows.map((row: PrismaApiLog) => AuditConverter.toApiLogDto(row));
  }

  async findSystemEvents(
    criteria: SystemEventSearchCriteria & DatabasePagination,
  ): Promise<SystemEventDto[]> {
    const rows = await this.prisma.systemEvent.findMany({
      where: {
        eventType: criteria.eventType ?? undefined,
        source: criteria.source ?? undefined,
        createdAt:
          criteria.startDate || criteria.endDate
            ? { gte: criteria.startDate ?? undefined, lte: criteria.endDate ?? undefined }
            : undefined,
      },
      orderBy: { createdAt: 'desc' },
      ...toSkipTake(criteria, AUDIT_PAGE),
    });
    return rows.map((row: PrismaSystemEvent) => AuditConverter.toSystemEventDto(row));
  }

  async findJobLogs(
    criteria: DatabaseTimeRange & DatabasePagination & { jobName?: string; status?: string },
  ): Promise<JobLogDto[]> {
    const { skip, take } = toSkipTake(criteria);
    const rows = await this.prisma.jobLog.findMany({
      where: {
        jobName: criteria.jobName ?? undefined,
        status: criteria.status ?? undefined,
        createdAt:
          criteria.startDate || criteria.endDate
            ? { gte: criteria.startDate ?? undefined, lte: criteria.endDate ?? undefined }
            : undefined,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    return rows.map((row: PrismaJobLog) => AuditConverter.toJobLogDto(row));
  }

  async findLoginAttempts(
    criteria: DatabaseTimeRange &
      DatabasePagination & { identifier: string; userId?: string },
  ): Promise<LoginAttemptDto[]> {
    const { skip, take } = toSkipTake(criteria);
    const rows = await this.prisma.loginAttempt.findMany({
      where: {
        identifier: criteria.identifier,
        userId: criteria.userId ?? undefined,
        attemptedAt:
          criteria.startDate || criteria.endDate
            ? { gte: criteria.startDate ?? undefined, lte: criteria.endDate ?? undefined }
            : undefined,
      },
      orderBy: { attemptedAt: 'desc' },
      skip,
      take,
    });
    return rows.map((row: PrismaLoginAttempt) => AuditConverter.toLoginAttemptDto(row));
  }
}
