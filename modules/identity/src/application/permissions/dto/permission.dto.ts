export interface CreatePermissionUseCaseInput {
  /** Always populated by `CreatePermissionDto`'s `@Transform` before this
   * use-case ever sees it — the client cannot supply this field. */
  key: string;
  resource: string;
  action: string;
  description?: string | null;
  isSystem?: boolean;
  isActive?: boolean;
}

export interface UpdatePermissionUseCaseInput {
  description?: string | null;
  isActive?: boolean;
}

export interface ListPermissionsUseCaseInput {
  resource?: string;
  isActive?: boolean;
}
