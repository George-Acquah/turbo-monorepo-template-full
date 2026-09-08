import { Inject, Injectable } from '@nestjs/common';
import {
  USER_ROLE_REPOSITORY_TOKEN,
  type UserRoleRepositoryPort,
  ROLE_REPOSITORY_TOKEN,
  type RoleRepositoryPort,
  CACHE_PORT_TOKEN,
  type CachePort,
} from '@workspace/ports';
import { CacheTTL, RedisKeyPrefixes } from '@workspace/constants';
import { toLowerCase } from '@workspace/utils/string';

interface ActiveRoleRef {
  roleId: string;
  roleKey: string;
}

/**
 * Resolves "what may this user do" from a live, cached lookup keyed by
 * userId — NOT a JWT claim. Doc 06 wants the role→permission cache "busted
 * on role edits"; a JWT claim can't be busted mid-session (15 min access
 * token TTL), so trusting one would let a just-revoked role keep working for
 * up to 15 minutes. modules/identity's write-side use-cases (assign/revoke
 * role, grant/revoke permission) bust these same cache entries on every
 * mutation.
 *
 * Depends only on ports (`@workspace/ports`), not on `modules/identity`'s
 * concrete classes — any consumer wiring `IdentityPersistenceModule` (via
 * `PermissionsModule`, see index.ts) gets a working resolver, including
 * future modules gating their own `@RequirePermission(...)` routes.
 */
@Injectable()
export class PermissionResolverService {
  constructor(
    @Inject(USER_ROLE_REPOSITORY_TOKEN) private readonly userRoleRepo: UserRoleRepositoryPort,
    @Inject(ROLE_REPOSITORY_TOKEN) private readonly roleRepo: RoleRepositoryPort,
    @Inject(CACHE_PORT_TOKEN) private readonly cache: CachePort,
  ) {}

  async getPermissionsForUser(userId: string): Promise<Set<string>> {
    const roles = await this.getActiveRoles(userId);
    const permissionSets = await Promise.all(
      roles.map((role) => this.getRolePermissions(role.roleId)),
    );
    return new Set(permissionSets.flat());
  }

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const permissions = await this.getPermissionsForUser(userId);
    return permissions.has(`${toLowerCase(resource)}:${toLowerCase(action)}`);
  }

  async getActiveRoleKeys(userId: string): Promise<Set<string>> {
    const roles = await this.getActiveRoles(userId);
    return new Set(roles.map((role) => role.roleKey));
  }

  async hasAnyRole(userId: string, roleKeys: string[]): Promise<boolean> {
    if (roleKeys.length === 0) return false;
    const activeKeys = await this.getActiveRoleKeys(userId);
    return roleKeys.some((key) => activeKeys.has(key));
  }

  private async getActiveRoles(userId: string): Promise<ActiveRoleRef[]> {
    const cached = await this.cache.getOrSetEntity<ActiveRoleRef[]>(
      RedisKeyPrefixes.IDENTITY.USER_ROLES,
      userId,
      async () => {
        const assignments = await this.userRoleRepo.findActiveAssignments(userId);
        return assignments.map((a) => ({ roleId: a.roleId, roleKey: a.roleKey }));
      },
      { ttl: CacheTTL.POLICY },
    );
    return cached ?? [];
  }

  private async getRolePermissions(roleId: string): Promise<string[]> {
    const cached = await this.cache.getOrSetEntity<string[]>(
      RedisKeyPrefixes.IDENTITY.ROLE_PERMISSIONS,
      roleId,
      () => this.roleRepo.findRolePermissions(roleId),
      { ttl: CacheTTL.POLICY },
    );
    return cached ?? [];
  }
}
