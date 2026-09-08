import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import type { RoleRepositoryPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { CreateRoleUseCase } from '../../../../src/application/roles/use-cases/create-role.use-case';

describe('CreateRoleUseCase', () => {
  let roleRepo: ReturnType<typeof createMock<Pick<RoleRepositoryPort, 'findByKey' | 'create'>>>;
  let useCase: CreateRoleUseCase;

  beforeEach(() => {
    roleRepo = createMock<Pick<RoleRepositoryPort, 'findByKey' | 'create'>>(['findByKey', 'create']);
    useCase = new CreateRoleUseCase(roleRepo as unknown as RoleRepositoryPort);
  });

  it('rejects when a role with the same key already exists', async () => {
    roleRepo.findByKey.mockResolvedValue({ id: 'rol_existing' } as never);

    await expect(
      useCase.execute({ key: 'platform_support', name: 'Platform Support' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(roleRepo.create).not.toHaveBeenCalled();
  });

  it('creates the role with a generated prefixed id and sane defaults', async () => {
    roleRepo.findByKey.mockResolvedValue(null);
    roleRepo.create.mockResolvedValue({ id: 'rol_new', key: 'mentor', name: 'Mentor' } as never);

    const result = await useCase.execute({ key: 'mentor', name: 'Mentor' });

    expect(roleRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^rol_/),
        key: 'mentor',
        name: 'Mentor',
        description: null,
        isSystem: false,
        isActive: true,
        createdByUserId: null,
        metadata: null,
      }),
    );
    expect(result.id).toBe('rol_new');
  });
});
