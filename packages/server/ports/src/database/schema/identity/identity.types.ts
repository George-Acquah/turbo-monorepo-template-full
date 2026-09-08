import { ApiClientStatus, ApiKeyStatus } from '@workspace/constants';
import { RepoQueryOptions } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Permission Types
// ─────────────────────────────────────────────────────────────────────────────
export interface PermissionPersistence {
  id: string;
  key: string;
  resource: string;
  action: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePermissionInput extends Omit<
  PermissionPersistence,
  'id' | 'createdAt' | 'updatedAt'
> {
  id?: string;
}

export type UpdatePermissionInput = Partial<
  Pick<PermissionPersistence, 'description' | 'isActive'>
>;

// ─────────────────────────────────────────────────────────────────────────────
// Role & RolePermission Types
// ─────────────────────────────────────────────────────────────────────────────
// Single-tenant: no tenantId/schoolId/scope. Role keys are one of
// platform_admin | platform_support | platform_auditor | mentor (doc 03 §2.2).
export interface RolePersistence {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdByUserId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleInput extends Omit<
  RolePersistence,
  'id' | 'createdAt' | 'updatedAt'
> {
  id?: string;
}

export type UpdateRoleInput = Partial<
  Pick<RolePersistence, 'name' | 'description' | 'isActive' | 'metadata'>
>;

export interface RolePermissionPersistence {
  roleId: string;
  permissionId: string;
  createdByUserId: string | null;
  createdAt: Date;
}

export interface AssignRolePermissionInput {
  roleId: string;
  permissionId: string;
  createdByUserId?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// UserRole Assignment Types
// ─────────────────────────────────────────────────────────────────────────────
export interface UserRolePersistence {
  id: string;
  userId: string; // workspace_auth.users.id — string ref, no FK
  roleId: string;
  roleKey: string; // denormalised for fast JWT claims
  grantedBy: string | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleWithRolePersistence extends UserRolePersistence {
  role: Pick<RolePersistence, 'id' | 'key' | 'name'>;
}

export interface CreateUserRoleInput extends Omit<
  UserRolePersistence,
  'id' | 'revokedAt' | 'createdAt' | 'updatedAt'
> {
  id?: string;
}

export type RevokeUserRoleInput = Pick<UserRolePersistence, 'roleId'> & { revokedAt?: Date };

// ─────────────────────────────────────────────────────────────────────────────
// ApiClient & ApiKey Types
// ─────────────────────────────────────────────────────────────────────────────
export interface ApiClientPersistence {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  clientSecretHash: string;
  status: ApiClientStatus;
  createdByUserId: string | null;
  lastUsedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateApiClientInput extends Omit<
  ApiClientPersistence,
  'id' | 'status' | 'lastUsedAt' | 'createdAt' | 'updatedAt' | 'deletedAt'
> {
  id?: string;
}

export type UpdateApiClientInput = Partial<
  Pick<ApiClientPersistence, 'name' | 'description' | 'status' | 'metadata' | 'clientSecretHash'>
>;

export interface ApiKeyPersistence {
  id: string;
  apiClientId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  status: ApiKeyStatus;
  scopes: string[];
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateApiKeyInput extends Omit<
  ApiKeyPersistence,
  'id' | 'status' | 'lastUsedAt' | 'revokedAt' | 'createdAt'
> {
  id?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Options
// ─────────────────────────────────────────────────────────────────────────────
export type RolePersistenceQueryOptions<K extends keyof RolePersistence = keyof RolePersistence> =
  RepoQueryOptions<RolePersistence, K>;

export type PermissionPersistenceQueryOptions<
  K extends keyof PermissionPersistence = keyof PermissionPersistence,
> = RepoQueryOptions<PermissionPersistence, K>;

export type ApiClientPersistenceQueryOptions<
  K extends keyof ApiClientPersistence = keyof ApiClientPersistence,
> = RepoQueryOptions<ApiClientPersistence, K>;

export type ApiKeyPersistenceQueryOptions<
  K extends keyof ApiKeyPersistence = keyof ApiKeyPersistence,
> = RepoQueryOptions<ApiKeyPersistence, K>;
