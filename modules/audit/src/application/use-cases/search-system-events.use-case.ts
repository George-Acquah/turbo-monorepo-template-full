import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_QUERY_PORT,
  type AuditQueryPort,
  type SystemEventDto,
  type SystemEventSearchCriteria,
} from '@workspace/ports';

@Injectable()
export class SearchSystemEventsUseCase {
  constructor(@Inject(AUDIT_QUERY_PORT) private readonly auditQuery: AuditQueryPort) {}

  async execute(criteria: SystemEventSearchCriteria): Promise<SystemEventDto[]> {
    return this.auditQuery.findSystemEvents(criteria);
  }
}
