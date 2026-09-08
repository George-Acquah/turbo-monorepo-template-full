import { describe, it, expect, beforeEach } from '@jest/globals';
import type { CachePort, RoleRepositoryPort, UserRoleRepositoryPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { PermissionResolverService } from '../../src/services/permission-resolver.service';

describe('PermissionResolverService', () => {
  let userRoleRepo: ReturnType<typeof createMock<Pick<UserRoleRepositoryPort, 'findActiveAssignments'>>>;
  let roleRepo: ReturnType<typeof createMock<Pick<RoleRepositoryPort, 'findRolePermissions'>>>;
  let cache: ReturnType<typeof createMock<Pick<CachePort, 'getOrSetEntity'>>>;
  let service: PermissionResolverService;

  beforeEach(() => {
    userRoleRepo = createMock<Pick<UserRoleRepositoryPort, 'findActiveAssignments'>>([
      'findActiveAssignments',
    ]);
    roleRepo = createMock<Pick<RoleRepositoryPort, 'findRolePermissions'>>(['findRolePermissions']);
    cache = createMock<Pick<CachePort, 'getOrSetEntity'>>(['getOrSetEntity']);
    // Cache-miss passthrough for every test — exercises the real factory logic.
    cache.getOrSetEntity.mockImplementation(((_prefix: string, _id: string, factory: () => unknown) =>
      factory()) as never);

    service = new PermissionResolverService(
      userRoleRepo as unknown as UserRoleRepositoryPort,
      roleRepo as unknown as RoleRepositoryPort,
      cache as unknown as CachePort,
    );
  });

  it('unions permissions across every active role', async () => {
    userRoleRepo.findActiveAssignments.mockResolvedValue([
      { roleId: 'rol_1', roleKey: 'platform_support' } as never,
      { roleId: 'rol_2', roleKey: 'mentor' } as never,
    ]);
    roleRepo.findRolePermissions.mockImplementation(((roleId: string) =>
      Promise.resolve(roleId === 'rol_1' ? ['user:read', 'billing:read'] : ['events:write'])) as never);

    const permissions = await service.getPermissionsForUser('usr_1');

    expect(permissions).toEqual(new Set(['user:read', 'billing:read', 'events:write']));
  });

  it('hasPermission checks membership in the resolved set', async () => {
    userRoleRepo.findActiveAssignments.mockResolvedValue([{ roleId: 'rol_1', roleKey: 'mentor' } as never]);
    roleRepo.findRolePermissions.mockResolvedValue(['events:write']);

    await expect(service.hasPermission('usr_1', 'events', 'write')).resolves.toBe(true);
    await expect(service.hasPermission('usr_1', 'refund', 'approve')).resolves.toBe(false);
  });

  it('hasAnyRole matches against the user\'s active role keys', async () => {
    userRoleRepo.findActiveAssignments.mockResolvedValue([
      { roleId: 'rol_1', roleKey: 'platform_support' } as never,
    ]);

    await expect(service.hasAnyRole('usr_1', ['platform_admin', 'platform_support'])).resolves.toBe(true);
    await expect(service.hasAnyRole('usr_1', ['platform_admin'])).resolves.toBe(false);
  });

  it('hasAnyRole short-circuits to false for an empty required-roles list', async () => {
    await expect(service.hasAnyRole('usr_1', [])).resolves.toBe(false);
    expect(userRoleRepo.findActiveAssignments).not.toHaveBeenCalled();
  });
});
