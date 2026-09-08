import type { DatabasePagination, DatabaseTimeRange } from '../shared';
import {
  ApiLogDto,
  AuditLogDto,
  AuditSearchCriteria,
  JobLogDto,
  LoginAttemptDto,
  SystemEventDto,
  SystemEventSearchCriteria,
} from './audit.types';

export abstract class AuditQueryPort {
  abstract findAuditLogById(id: string): Promise<AuditLogDto | null>;
  abstract searchAuditLogs(
    criteria: AuditSearchCriteria,
  ): Promise<{ total: number; items: AuditLogDto[] }>;
  // Pagination is part of the contract on every list read, not optional
  // sugar: `findJobLogs`/`findLoginAttempts` already took DatabasePagination,
  // while these three did not — so an implementation had no way to bound them
  // and Prisma returned the whole table. See the audit adapter's AUDIT_PAGE.
  abstract findEntityAuditHistory(
    entityType: string,
    entityId: string,
    pagination?: DatabasePagination,
  ): Promise<AuditLogDto[]>;
  abstract findApiLogs(
    criteria: DatabaseTimeRange &
      DatabasePagination & {
        path?: string;
        method?: string;
      },
  ): Promise<ApiLogDto[]>;
  abstract findSystemEvents(
    criteria: SystemEventSearchCriteria & DatabasePagination,
  ): Promise<SystemEventDto[]>;
  abstract findJobLogs(
    criteria: DatabaseTimeRange &
      DatabasePagination & {
        jobName?: string;
        status?: string;
      },
  ): Promise<JobLogDto[]>;
  abstract findLoginAttempts(
    criteria: DatabaseTimeRange &
      DatabasePagination & {
        identifier: string;
        userId?: string;
      },
  ): Promise<LoginAttemptDto[]>;
}

export const AUDIT_QUERY_PORT = Symbol('AUDIT_QUERY_PORT');
