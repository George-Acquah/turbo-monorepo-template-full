import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { GetAuditLogByIdUseCase } from '../../../src/application/use-cases/get-audit-log-by-id.use-case';
import type { AuditQueryPort } from '@workspace/ports';

describe('GetAuditLogByIdUseCase', () => {
  let auditQuery: { findAuditLogById: ReturnType<typeof jest.fn> };
  let useCase: GetAuditLogByIdUseCase;

  beforeEach(() => {
    auditQuery = { findAuditLogById: jest.fn() };
    useCase = new GetAuditLogByIdUseCase(auditQuery as unknown as AuditQueryPort);
  });

  it('returns the audit log when found', async () => {
    auditQuery.findAuditLogById.mockResolvedValue({ id: 'aud_1' });

    const result = await useCase.execute('aud_1');

    expect(result).toEqual({ id: 'aud_1' });
  });

  it('throws NotFoundException when the audit log does not exist', async () => {
    auditQuery.findAuditLogById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
