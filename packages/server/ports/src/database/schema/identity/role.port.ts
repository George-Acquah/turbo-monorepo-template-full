import { DatabaseTx } from '../shared';
import {
  RolePersistence,
  CreateRoleInput,
  UpdateRoleInput,
  RolePermissionPersistence,
  AssignRolePermissionInput,
  RolePersistenceQueryOptions,
} from './identity.types';

// Single-tenant RBAC — platform-level roles only (doc 03 §2.2). No tenant/
// school scoping; Role.key is globally unique.
export abstract class RoleRepositoryPort {
  // ── Writes (always return the full entity — you need to confirm what was persisted)

  abstract create(data: CreateRoleInput, tx?: DatabaseTx): Promise<RolePersistence>;

  abstract update(id: string, data: UpdateRoleInput, tx?: DatabaseTx): Promise<RolePersistence>;

  abstract softDelete(id: string, tx?: DatabaseTx): Promise<void>;

  // ── Reads (projection-aware) ────────────────────────────────────────────────

  abstract findById<K extends keyof RolePersistence = keyof RolePersistence>(
    id: string,
    options?: RolePersistenceQueryOptions<K>,
  ): Promise<Pick<RolePersistence, K> | null>;

  abstract findByKey<K extends keyof RolePersistence = keyof RolePersistence>(
    key: string,
    options?: RolePersistenceQueryOptions<K>,
  ): Promise<Pick<RolePersistence, K> | null>;

  abstract findMany<K extends keyof RolePersistence = keyof RolePersistence>(
    params: { isActive?: boolean },
    options?: RolePersistenceQueryOptions<K>,
  ): Promise<Pick<RolePersistence, K>[]>;

  // ── Permission links (specific return shapes — no projection needed) ────────

  /** Links a permission to a role. */
  abstract assignPermission(
    data: AssignRolePermissionInput,
    tx?: DatabaseTx,
  ): Promise<RolePermissionPersistence>;

  /** Removes a permission link from a role. */
  abstract revokePermission(roleId: string, permissionId: string, tx?: DatabaseTx): Promise<void>;

  /**
   * Resolves all active permission keys granted directly by a role.
   * Returns keys only — always a fixed shape, no projection needed.
   */
  abstract findRolePermissions(roleId: string, tx?: DatabaseTx): Promise<string[]>;
}

export const ROLE_REPOSITORY_TOKEN = Symbol('ROLE_REPOSITORY_TOKEN');
export const PRISMA_ROLE_REPOSITORY_TOKEN = Symbol('PRISMA_ROLE_REPOSITORY_TOKEN');
