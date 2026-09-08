import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_QUERY_PORT,
  type AuditQueryPort,
  type DatabasePagination,
  type DatabaseTimeRange,
  type JobLogDto,
} from '@workspace/ports';

export interface SearchJobLogsInput extends DatabaseTimeRange, DatabasePagination {
  jobName?: string;
  status?: string;
}

@Injectable()
export class SearchJobLogsUseCase {
  constructor(@Inject(AUDIT_QUERY_PORT) private readonly auditQuery: AuditQueryPort) {}

  async execute(criteria: SearchJobLogsInput): Promise<JobLogDto[]> {
    return this.auditQuery.findJobLogs(criteria);
  }
}
