import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import type {
  CachePort,
  EventPublisherPort,
  RoleRepositoryPort,
  TransactionPort,
  UserRoleRepositoryPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { AssignRoleToUserUseCase } from '../../../../src/application/user-roles/use-cases/assign-role-to-user.use-case';

describe('AssignRoleToUserUseCase', () => {
  let userRoleRepo: ReturnType<
    typeof createMock<Pick<UserRoleRepositoryPort, 'findActiveAssignments' | 'assign'>>
  >;
  let roleRepo: ReturnType<typeof createMock<Pick<RoleRepositoryPort, 'findById'>>>;
  let cache: ReturnType<typeof createMock<Pick<CachePort, 'deleteEntity'>>>;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>>;
  let transactionPort: ReturnType<typeof createMock<Pick<TransactionPort, 'execute'>>>;
  let useCase: AssignRoleToUserUseCase;

  beforeEach(() => {
    userRoleRepo = createMock<Pick<UserRoleRepositoryPort, 'findActiveAssignments' | 'assign'>>([
      'findActiveAssignments',
      'assign',
    ]);
    roleRepo = createMock<Pick<RoleRepositoryPort, 'findById'>>(['findById']);
    cache = createMock<Pick<CachePort, 'deleteEntity'>>(['deleteEntity']);
    publisher = createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>([
      'publishWithTransaction',
    ]);
    transactionPort = createMock<Pick<TransactionPort, 'execute'>>(['execute']);
    transactionPort.execute.mockImplementation(((op: (tx: unknown) => unknown) =>
      op(undefined)) as never);

    useCase = new AssignRoleToUserUseCase(
      userRoleRepo as unknown as UserRoleRepositoryPort,
      roleRepo as unknown as RoleRepositoryPort,
      cache as unknown as CachePort,
      publisher as unknown as EventPublisherPort,
      transactionPort as unknown as TransactionPort,
    );
  });

  it('rejects when the role does not exist', async () => {
    roleRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'usr_1', roleId: 'rol_missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects when the user already has an active assignment for the role', async () => {
    roleRepo.findById.mockResolvedValue({ id: 'rol_1', key: 'mentor' } as never);
    userRoleRepo.findActiveAssignments.mockResolvedValue([
      { roleId: 'rol_1' } as never,
    ]);

    await expect(
      useCase.execute({ userId: 'usr_1', roleId: 'rol_1' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(userRoleRepo.assign).not.toHaveBeenCalled();
  });

  it('assigns the role, publishes the fact, and busts the user-roles cache', async () => {
    roleRepo.findById.mockResolvedValue({ id: 'rol_1', key: 'mentor' } as never);
    userRoleRepo.findActiveAssignments.mockResolvedValue([]);
    userRoleRepo.assign.mockResolvedValue({ id: 'url_1', userId: 'usr_1', roleId: 'rol_1' } as never);

    await useCase.execute({ userId: 'usr_1', roleId: 'rol_1', grantedBy: 'usr_admin' });

    expect(userRoleRepo.assign).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^url_/),
        userId: 'usr_1',
        roleId: 'rol_1',
        roleKey: 'mentor',
        grantedBy: 'usr_admin',
      }),
      undefined,
    );
    expect(publisher.publishWithTransaction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ eventType: 'workspace.identity.role.assigned', aggregateId: 'url_1' }),
    );
    expect(cache.deleteEntity).toHaveBeenCalledWith('identity:rbac:user', 'usr_1');
  });
});
