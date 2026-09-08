import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GetEntityAuditHistoryUseCase } from '../../../src/application/use-cases/get-entity-audit-history.use-case';
import type { AuditQueryPort } from '@workspace/ports';

describe('GetEntityAuditHistoryUseCase', () => {
  let auditQuery: { findEntityAuditHistory: ReturnType<typeof jest.fn> };
  let useCase: GetEntityAuditHistoryUseCase;

  beforeEach(() => {
    auditQuery = { findEntityAuditHistory: jest.fn().mockResolvedValue([{ id: 'aud_1' }]) };
    useCase = new GetEntityAuditHistoryUseCase(auditQuery as unknown as AuditQueryPort);
  });

  it('delegates to AuditQueryPort.findEntityAuditHistory with entityType and entityId', async () => {
    const result = await useCase.execute('PAYMENT', 'pay_1');

    expect(auditQuery.findEntityAuditHistory).toHaveBeenCalledWith('PAYMENT', 'pay_1');
    expect(result).toEqual([{ id: 'aud_1' }]);
  });
});
