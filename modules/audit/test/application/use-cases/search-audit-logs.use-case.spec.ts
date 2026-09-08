import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SearchAuditLogsUseCase } from '../../../src/application/use-cases/search-audit-logs.use-case';
import type { AuditQueryPort } from '@workspace/ports';

describe('SearchAuditLogsUseCase', () => {
  let auditQuery: { searchAuditLogs: ReturnType<typeof jest.fn> };
  let useCase: SearchAuditLogsUseCase;

  beforeEach(() => {
    auditQuery = { searchAuditLogs: jest.fn().mockResolvedValue({ total: 0, items: [] }) };
    useCase = new SearchAuditLogsUseCase(auditQuery as unknown as AuditQueryPort);
  });

  it('delegates to AuditQueryPort.searchAuditLogs with the given criteria', async () => {
    const criteria = { entityType: 'PAYMENT', take: 20 };

    const result = await useCase.execute(criteria);

    expect(auditQuery.searchAuditLogs).toHaveBeenCalledWith(criteria);
    expect(result).toEqual({ total: 0, items: [] });
  });
});
