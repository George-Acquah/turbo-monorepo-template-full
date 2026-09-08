import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SearchApiLogsUseCase } from '../../../src/application/use-cases/search-api-logs.use-case';
import type { AuditQueryPort } from '@workspace/ports';

describe('SearchApiLogsUseCase', () => {
  let auditQuery: { findApiLogs: ReturnType<typeof jest.fn> };
  let useCase: SearchApiLogsUseCase;

  beforeEach(() => {
    auditQuery = { findApiLogs: jest.fn().mockResolvedValue([]) };
    useCase = new SearchApiLogsUseCase(auditQuery as unknown as AuditQueryPort);
  });

  it('delegates to AuditQueryPort.findApiLogs with the given criteria', async () => {
    const criteria = { method: 'POST', path: '/v1/auth/login' };

    await useCase.execute(criteria);

    expect(auditQuery.findApiLogs).toHaveBeenCalledWith(criteria);
  });
});
