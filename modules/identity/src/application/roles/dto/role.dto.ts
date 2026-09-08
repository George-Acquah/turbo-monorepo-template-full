export interface CreateRoleUseCaseInput {
  key: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  isActive?: boolean;
  createdByUserId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateRoleUseCaseInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface ListRolesUseCaseInput {
  isActive?: boolean;
}

export interface AssignPermissionToRoleUseCaseInput {
  roleId: string;
  permissionId: string;
  grantedByUserId?: string | null;
}

export interface RevokePermissionFromRoleUseCaseInput {
  roleId: string;
  permissionId: string;
}
