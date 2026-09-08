import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_QUERY_PORT,
  type ApiLogDto,
  type AuditQueryPort,
  type DatabaseTimeRange,
} from '@workspace/ports';

export interface SearchApiLogsInput extends DatabaseTimeRange {
  path?: string;
  method?: string;
}

@Injectable()
export class SearchApiLogsUseCase {
  constructor(@Inject(AUDIT_QUERY_PORT) private readonly auditQuery: AuditQueryPort) {}

  async execute(criteria: SearchApiLogsInput): Promise<ApiLogDto[]> {
    return this.auditQuery.findApiLogs(criteria);
  }
}
