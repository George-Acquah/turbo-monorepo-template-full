import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SearchLoginAttemptsUseCase } from '../../../src/application/use-cases/search-login-attempts.use-case';
import type { AuditQueryPort } from '@workspace/ports';

describe('SearchLoginAttemptsUseCase', () => {
  let auditQuery: { findLoginAttempts: ReturnType<typeof jest.fn> };
  let useCase: SearchLoginAttemptsUseCase;

  beforeEach(() => {
    auditQuery = { findLoginAttempts: jest.fn().mockResolvedValue([]) };
    useCase = new SearchLoginAttemptsUseCase(auditQuery as unknown as AuditQueryPort);
  });

  it('delegates to AuditQueryPort.findLoginAttempts with the given criteria', async () => {
    const criteria = { identifier: 'member@example.com' };

    await useCase.execute(criteria);

    expect(auditQuery.findLoginAttempts).toHaveBeenCalledWith(criteria);
  });
});
