import { SystemRoleKey } from '@workspace/constants';
import { AppRequest, UserContext, PermissionMetadata } from '@workspace/types';

export abstract class RbacPort {
  abstract getCurrentRole(): SystemRoleKey | null;
  abstract requireAuthenticatedUser(user?: UserContext): UserContext;
  abstract hasAnyRole(requiredRoles: readonly SystemRoleKey[], user?: UserContext): boolean;
  abstract requireRoles(requiredRoles: readonly SystemRoleKey[], user?: UserContext): UserContext;
  abstract authorizePermission(
    permission: PermissionMetadata,
    request?: AppRequest,
  ): Promise<unknown>;
  abstract getAdminRoles(): readonly SystemRoleKey[];
}

export const RBAC_PORT_TOKEN = Symbol('RBAC_PORT_TOKEN');
