import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_QUERY_PORT,
  type AuditLogDto,
  type AuditQueryPort,
  type AuditSearchCriteria,
} from '@workspace/ports';

/**
 * Self-service "my activity" read. `actorId` is deliberately omitted from the
 * input type — not just trusted from the caller — so it's structurally
 * impossible for a caller-supplied `actorId` to reach the query. This
 * use-case is what pins scope to the authenticated caller.
 */
@Injectable()
export class GetMyActivityUseCase {
  constructor(@Inject(AUDIT_QUERY_PORT) private readonly auditQuery: AuditQueryPort) {}

  async execute(
    actorId: string,
    criteria: Omit<AuditSearchCriteria, 'actorId'>,
  ): Promise<{ total: number; items: AuditLogDto[] }> {
    return this.auditQuery.searchAuditLogs({ ...criteria, actorId });
  }
}
