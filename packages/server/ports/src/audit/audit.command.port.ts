import {
  AuditLogDto,
  ApiLogDto,
  JobLogDto,
  LoginAttemptDto,
  SystemEventDto,
  AuditLogInput,
  SystemEventInput,
  ApiLogInput,
  JobLogInput,
  LoginAttemptInput,
} from './audit.types';

export abstract class AuditCommandPort {
  abstract createAuditLog(data: AuditLogInput, txClient?: unknown): Promise<AuditLogDto>;

  abstract createSystemEvent(data: SystemEventInput, txClient?: unknown): Promise<SystemEventDto>;

  abstract createApiLog(data: ApiLogInput, txClient?: unknown): Promise<ApiLogDto>;

  abstract createJobLog(data: JobLogInput, txClient?: unknown): Promise<JobLogDto>;

  abstract createLoginAttempt(
    data: LoginAttemptInput,
    // txClient?: unknown,
  ): Promise<LoginAttemptDto>;
}

export const AUDIT_COMMAND_PORT = Symbol('AUDIT_COMMAND_PORT');
