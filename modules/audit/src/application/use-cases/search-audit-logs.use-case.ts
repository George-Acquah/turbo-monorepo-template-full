import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_QUERY_PORT,
  type AuditLogDto,
  type AuditQueryPort,
  type AuditSearchCriteria,
} from '@workspace/ports';

@Injectable()
export class SearchAuditLogsUseCase {
  constructor(@Inject(AUDIT_QUERY_PORT) private readonly auditQuery: AuditQueryPort) {}

  async execute(criteria: AuditSearchCriteria): Promise<{ total: number; items: AuditLogDto[] }> {
    return this.auditQuery.searchAuditLogs(criteria);
  }
}
