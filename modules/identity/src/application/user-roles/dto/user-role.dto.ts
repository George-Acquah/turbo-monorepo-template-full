export interface AssignRoleToUserUseCaseInput {
  userId: string;
  roleId: string;
  grantedBy?: string | null;
  expiresAt?: Date | null;
}

export interface RevokeRoleFromUserUseCaseInput {
  userId: string;
  roleId: string;
}
