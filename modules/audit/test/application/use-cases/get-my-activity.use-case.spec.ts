import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GetMyActivityUseCase } from '../../../src/application/use-cases/get-my-activity.use-case';
import type { AuditQueryPort, AuditSearchCriteria } from '@workspace/ports';

describe('GetMyActivityUseCase', () => {
  let auditQuery: { searchAuditLogs: ReturnType<typeof jest.fn> };
  let useCase: GetMyActivityUseCase;

  beforeEach(() => {
    auditQuery = { searchAuditLogs: jest.fn().mockResolvedValue({ total: 0, items: [] }) };
    useCase = new GetMyActivityUseCase(auditQuery as unknown as AuditQueryPort);
  });

  it('scopes the search to the given actorId regardless of other criteria', async () => {
    const criteria = { entityType: 'PAYMENT', take: 20 };

    const result = await useCase.execute('usr_caller', criteria);

    expect(auditQuery.searchAuditLogs).toHaveBeenCalledWith({
      entityType: 'PAYMENT',
      take: 20,
      actorId: 'usr_caller',
    });
    expect(result).toEqual({ total: 0, items: [] });
  });

  it('always pins actorId to the authenticated caller, never a caller-supplied value', async () => {
    // Even if a caller-supplied actorId somehow reached this far (e.g. from an
    // untyped call site), the use-case's own spread order overwrites it with
    // the authenticated actorId — it is the last write in the object literal.
    const criteria = { actorId: 'usr_someone_else' } as unknown as Omit<AuditSearchCriteria, 'actorId'>;

    await useCase.execute('usr_caller', criteria);

    expect(auditQuery.searchAuditLogs).toHaveBeenCalledWith({ actorId: 'usr_caller' });
  });
});
