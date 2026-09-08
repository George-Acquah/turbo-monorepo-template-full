import { describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import type {
  CachePort,
  EventPublisherPort,
  PermissionRepositoryPort,
  RoleRepositoryPort,
  TransactionPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { AssignPermissionToRoleUseCase } from '../../../../src/application/roles/use-cases/assign-permission-to-role.use-case';

describe('AssignPermissionToRoleUseCase', () => {
  let roleRepo: ReturnType<typeof createMock<Pick<RoleRepositoryPort, 'findById' | 'assignPermission'>>>;
  let permissionRepo: ReturnType<typeof createMock<Pick<PermissionRepositoryPort, 'findById'>>>;
  let cache: ReturnType<typeof createMock<Pick<CachePort, 'deleteEntity'>>>;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>>;
  let transactionPort: ReturnType<typeof createMock<Pick<TransactionPort, 'execute'>>>;
  let useCase: AssignPermissionToRoleUseCase;

  beforeEach(() => {
    roleRepo = createMock<Pick<RoleRepositoryPort, 'findById' | 'assignPermission'>>([
      'findById',
      'assignPermission',
    ]);
    permissionRepo = createMock<Pick<PermissionRepositoryPort, 'findById'>>(['findById']);
    cache = createMock<Pick<CachePort, 'deleteEntity'>>(['deleteEntity']);
    publisher = createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>([
      'publishWithTransaction',
    ]);
    transactionPort = createMock<Pick<TransactionPort, 'execute'>>(['execute']);
    transactionPort.execute.mockImplementation(((op: (tx: unknown) => unknown) =>
      op(undefined)) as never);

    useCase = new AssignPermissionToRoleUseCase(
      roleRepo as unknown as RoleRepositoryPort,
      permissionRepo as unknown as PermissionRepositoryPort,
      cache as unknown as CachePort,
      publisher as unknown as EventPublisherPort,
      transactionPort as unknown as TransactionPort,
    );
  });

  it('rejects when the role does not exist', async () => {
    roleRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ roleId: 'rol_missing', permissionId: 'pmt_1' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(roleRepo.assignPermission).not.toHaveBeenCalled();
  });

  it('rejects when the permission does not exist', async () => {
    roleRepo.findById.mockResolvedValue({ id: 'rol_1', key: 'mentor' } as never);
    permissionRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ roleId: 'rol_1', permissionId: 'pmt_missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(roleRepo.assignPermission).not.toHaveBeenCalled();
  });

  it('assigns the permission, publishes the fact, and busts the role-permissions cache', async () => {
    roleRepo.findById.mockResolvedValue({ id: 'rol_1', key: 'mentor' } as never);
    permissionRepo.findById.mockResolvedValue({ id: 'pmt_1', key: 'events:write' } as never);
    roleRepo.assignPermission.mockResolvedValue({ roleId: 'rol_1', permissionId: 'pmt_1' } as never);

    await useCase.execute({ roleId: 'rol_1', permissionId: 'pmt_1', grantedByUserId: 'usr_admin' });

    expect(roleRepo.assignPermission).toHaveBeenCalledWith(
      { roleId: 'rol_1', permissionId: 'pmt_1', createdByUserId: 'usr_admin' },
      undefined,
    );
    expect(publisher.publishWithTransaction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        eventType: 'workspace.identity.permission.granted_to_role',
        aggregateId: 'rol_1',
        payload: expect.objectContaining({ roleKey: 'mentor', permissionKey: 'events:write' }),
      }),
    );
    expect(cache.deleteEntity).toHaveBeenCalledWith('identity:rbac:role', 'rol_1');
  });
});
