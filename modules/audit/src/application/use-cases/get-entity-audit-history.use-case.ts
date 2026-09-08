import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_QUERY_PORT, type AuditLogDto, type AuditQueryPort } from '@workspace/ports';

@Injectable()
export class GetEntityAuditHistoryUseCase {
  constructor(@Inject(AUDIT_QUERY_PORT) private readonly auditQuery: AuditQueryPort) {}

  async execute(entityType: string, entityId: string): Promise<AuditLogDto[]> {
    return this.auditQuery.findEntityAuditHistory(entityType, entityId);
  }
}
