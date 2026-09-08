import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePermissionDto } from '../../../../src/presentation/dto/permissions/create-permission.dto';

describe('CreatePermissionDto', () => {
  it('derives a lowercase key from resource+action, ignoring any client-supplied key', async () => {
    const dto = plainToInstance(CreatePermissionDto, {
      key: 'client:supplied',
      resource: 'REFUND',
      action: 'APPROVE',
    });

    // Resource/Action constants are UPPERCASE; the key format is lowercase —
    // this also proves the lowercasing bug (present in the previously-shipped
    // use-case-level derivation) doesn't resurface here.
    expect(dto.key).toBe('refund:approve');

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects when resource or action is missing — no source fields, no key', async () => {
    const dto = plainToInstance(CreatePermissionDto, { resource: 'REFUND' });

    const errors = await validate(dto);
    const fields = errors.map((e) => e.property);
    expect(fields).toEqual(expect.arrayContaining(['action', 'key']));
  });
});
