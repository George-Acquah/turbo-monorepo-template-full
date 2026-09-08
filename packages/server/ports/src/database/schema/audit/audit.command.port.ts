import type { DatabaseTx } from '../shared';
import {
  ApiLogDto,
  ApiLogInput,
  AuditLogDto,
  AuditLogInput,
  JobLogDto,
  JobLogInput,
  LoginAttemptDto,
  LoginAttemptInput,
  SystemEventDto,
  SystemEventInput,
} from './audit.types';

export abstract class AuditCommandPort {
  abstract createAuditLog(data: AuditLogInput, tx?: DatabaseTx): Promise<AuditLogDto>;
  abstract createSystemEvent(data: SystemEventInput, tx?: DatabaseTx): Promise<SystemEventDto>;
  abstract createApiLog(data: ApiLogInput, tx?: DatabaseTx): Promise<ApiLogDto>;
  abstract createJobLog(data: JobLogInput, tx?: DatabaseTx): Promise<JobLogDto>;
  abstract createLoginAttempt(data: LoginAttemptInput, tx?: DatabaseTx): Promise<LoginAttemptDto>;
}

export const AUDIT_COMMAND_PORT = Symbol('AUDIT_COMMAND_PORT');
