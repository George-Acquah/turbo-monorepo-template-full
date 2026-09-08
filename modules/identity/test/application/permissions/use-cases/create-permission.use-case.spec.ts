import { describe, it, expect, beforeEach } from '@jest/globals';
import type { PermissionRepositoryPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { CreatePermissionUseCase } from '../../../../src/application/permissions/use-cases/create-permission.use-case';

// Key derivation (`${resource}:${action}`, lowercased) now happens in
// `CreatePermissionDto`'s `@Transform` — see
// test/presentation/dto/create-permission.dto.spec.ts — so `input.key` is
// always already-populated by the time this use-case runs. These tests only
// cover pass-through + conflict-checking.
describe('CreatePermissionUseCase', () => {
  let permissionRepo: ReturnType<typeof createMock<Pick<PermissionRepositoryPort, 'findByKey' | 'create'>>>;
  let useCase: CreatePermissionUseCase;

  beforeEach(() => {
    permissionRepo = createMock(['findByKey', 'create']);
    useCase = new CreatePermissionUseCase(permissionRepo as unknown as PermissionRepositoryPort);
  });

  it('creates a permission using the given key as-is', async () => {
    permissionRepo.findByKey.mockResolvedValue(null);
    permissionRepo.create.mockImplementation(async (data) => data as never);

    const result = await useCase.execute({ key: 'refund:approve', resource: 'REFUND', action: 'APPROVE' });

    expect(permissionRepo.findByKey).toHaveBeenCalledWith('refund:approve', { select: ['id'] });
    expect(permissionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'refund:approve' }),
    );
    expect(result.key).toBe('refund:approve');
  });

  it('throws CONFLICT when a permission with that key already exists', async () => {
    permissionRepo.findByKey.mockResolvedValue({ id: 'pmt_1' } as never);

    await expect(
      useCase.execute({ key: 'refund:approve', resource: 'REFUND', action: 'APPROVE' }),
    ).rejects.toMatchObject({
      errorCode: 'IDENTITY_PERMISSION_ALREADY_EXISTS',
    });
    expect(permissionRepo.create).not.toHaveBeenCalled();
  });
});
