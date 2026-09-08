import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SearchSystemEventsUseCase } from '../../../src/application/use-cases/search-system-events.use-case';
import type { AuditQueryPort } from '@workspace/ports';

describe('SearchSystemEventsUseCase', () => {
  let auditQuery: { findSystemEvents: ReturnType<typeof jest.fn> };
  let useCase: SearchSystemEventsUseCase;

  beforeEach(() => {
    auditQuery = { findSystemEvents: jest.fn().mockResolvedValue([]) };
    useCase = new SearchSystemEventsUseCase(auditQuery as unknown as AuditQueryPort);
  });

  it('delegates to AuditQueryPort.findSystemEvents with the given criteria', async () => {
    const criteria = { source: 'workers' as const };

    await useCase.execute(criteria);

    expect(auditQuery.findSystemEvents).toHaveBeenCalledWith(criteria);
  });
});
