import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SearchJobLogsUseCase } from '../../../src/application/use-cases/search-job-logs.use-case';
import type { AuditQueryPort } from '@workspace/ports';

describe('SearchJobLogsUseCase', () => {
  let auditQuery: { findJobLogs: ReturnType<typeof jest.fn> };
  let useCase: SearchJobLogsUseCase;

  beforeEach(() => {
    auditQuery = { findJobLogs: jest.fn().mockResolvedValue([]) };
    useCase = new SearchJobLogsUseCase(auditQuery as unknown as AuditQueryPort);
  });

  it('delegates to AuditQueryPort.findJobLogs with the given criteria', async () => {
    const criteria = { jobName: 'process-outbox-batch', take: 10 };

    await useCase.execute(criteria);

    expect(auditQuery.findJobLogs).toHaveBeenCalledWith(criteria);
  });
});
