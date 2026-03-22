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
  abstract findEntityAuditHistory(entityType: string, entityId: string): Promise<AuditLogDto[]>;
  abstract findApiLogs(
    criteria: DatabaseTimeRange & {
      companyId?: string;
      path?: string;
      method?: string;
    },
  ): Promise<ApiLogDto[]>;
  abstract findSystemEvents(criteria: SystemEventSearchCriteria): Promise<SystemEventDto[]>;
  abstract findJobLogs(
    criteria: DatabaseTimeRange &
      DatabasePagination & {
        companyId?: string;
        jobName?: string;
        status?: string;
      },
  ): Promise<JobLogDto[]>;
  abstract findLoginAttempts(
    criteria: DatabaseTimeRange &
      DatabasePagination & {
        companyId?: string;
        email?: string;
        userId?: string;
      },
  ): Promise<LoginAttemptDto[]>;
}

export const AUDIT_QUERY_PORT = Symbol('AUDIT_QUERY_PORT');
