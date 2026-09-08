import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_QUERY_PORT,
  type AuditQueryPort,
  type DatabasePagination,
  type DatabaseTimeRange,
  type LoginAttemptDto,
} from '@workspace/ports';

export interface SearchLoginAttemptsInput extends DatabaseTimeRange, DatabasePagination {
  identifier: string;
  userId?: string;
}

@Injectable()
export class SearchLoginAttemptsUseCase {
  constructor(@Inject(AUDIT_QUERY_PORT) private readonly auditQuery: AuditQueryPort) {}

  async execute(criteria: SearchLoginAttemptsInput): Promise<LoginAttemptDto[]> {
    return this.auditQuery.findLoginAttempts(criteria);
  }
}
