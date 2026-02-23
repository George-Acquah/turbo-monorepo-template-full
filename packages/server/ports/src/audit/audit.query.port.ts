import {
  AuditLogDto,
  ApiLogDto,
  JobLogDto,
  LoginAttemptDto,
  SystemEventDto,
  AuditSearchCriteria,
  SystemEventSearchCriteria,
} from './audit.types';

export abstract class AuditQueryPort {
  abstract findAuditLogById(id: string): Promise<AuditLogDto | null>;

  abstract searchAuditLogs(
    criteria: AuditSearchCriteria,
  ): Promise<{ total: number; items: AuditLogDto[] }>;

  abstract findEntityAuditHistory(entityType: string, entityId: string): Promise<AuditLogDto[]>;

  abstract findApiLogs(criteria: {
    companyId?: string;
    path?: string;
    method?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ApiLogDto[]>;

  abstract findSystemEvents(criteria: SystemEventSearchCriteria): Promise<SystemEventDto[]>;

  abstract findJobLogs(criteria: {
    companyId?: string;
    jobName?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<JobLogDto[]>;

  abstract findLoginAttempts(criteria: {
    companyId?: string;
    email?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<LoginAttemptDto[]>;
}

export const AUDIT_QUERY_PORT = Symbol('AUDIT_QUERY_PORT');
