import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { DecoratorKeys, IdentityErrorCodes, type SystemRoleKey } from '@workspace/constants';
import { ForbiddenAppException } from '@workspace/utils';
import { PermissionResolverService } from '../services/permission-resolver.service';

/**
 * Enforces `@Roles(...)` / `@AdminOnly()` (`@workspace/decorators`) — these
 * decorators existed as pure metadata with nothing reading them before this
 * guard. Runs after `JwtAuthGuard`: `@UseGuards(JwtAuthGuard, RolesGuard)`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionResolver: PermissionResolverService,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRoleKey[] | undefined>(
      DecoratorKeys.ROLES,
      [executionContext.getHandler(), executionContext.getClass()],
    );

    // Fail CLOSED, for the same reason as PermissionsGuard: listing this guard
    // is a statement of intent that the route is role-restricted, so a missing
    // @Roles()/@AdminOnly() is an omission rather than permission to let every
    // authenticated user through. A public route should not list the guard.
    if (!requiredRoles || requiredRoles.length === 0) {
      throw new ForbiddenAppException(
        IdentityErrorCodes.IDENTITY_PERMISSION_DENIED,
        `RolesGuard is applied to ` +
          `${executionContext.getClass()?.name || '<unknown class>'}.` +
          `${executionContext.getHandler()?.name || '<unknown handler>'} ` +
          `but no @Roles()/@AdminOnly() was declared. ` +
          `Refusing rather than allowing every authenticated user.`,
      );
    }

    const userId = this.context.getUserId();
    const allowed = await this.permissionResolver.hasAnyRole(userId, requiredRoles);

    if (!allowed) {
      throw new ForbiddenAppException(
        IdentityErrorCodes.IDENTITY_PERMISSION_DENIED,
        `Requires one of role(s): ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
