import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { DecoratorKeys, IdentityErrorCodes } from '@workspace/constants';
import type { PermissionMetadata } from '@workspace/types';
import { ForbiddenAppException } from '@workspace/utils';
import { PermissionResolverService } from '../services/permission-resolver.service';

/**
 * Enforces `@RequirePermission(action, resource)` (`@workspace/decorators`).
 * Runs after `JwtAuthGuard` — needs an authenticated userId already in
 * context: `@UseGuards(JwtAuthGuard, PermissionsGuard)`.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionResolver: PermissionResolverService,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<PermissionMetadata | undefined>(
      DecoratorKeys.PERMISSION,
      [executionContext.getHandler(), executionContext.getClass()],
    );

    // Fail CLOSED. Reaching this guard at all means a developer wrote
    // `@UseGuards(..., PermissionsGuard)` and therefore intended the route to
    // be authorization-checked; the absence of @RequirePermission is an
    // omission, not a decision to allow everyone. Returning true here is what
    // silently degraded the whole audit surface (7 routes, every one of them
    // reading cross-account PII) to "any logged-in user" — see
    // docs/infrastructure/runbooks/platform-readiness-audit-2026-08-09.md §3.1.
    //
    // A genuinely public route must not list this guard in the first place.
    if (!metadata) {
      throw new ForbiddenAppException(
        IdentityErrorCodes.IDENTITY_PERMISSION_DENIED,
        `PermissionsGuard is applied to ` +
          `${executionContext.getClass()?.name || '<unknown class>'}.` +
          `${executionContext.getHandler()?.name || '<unknown handler>'} ` +
          `but no @RequirePermission(action, resource) was declared. ` +
          `Refusing rather than allowing every authenticated user.`,
      );
    }

    const userId = this.context.getUserId();
    const allowed = await this.permissionResolver.hasPermission(userId, metadata.resource, metadata.action);

    if (!allowed) {
      throw new ForbiddenAppException(
        IdentityErrorCodes.IDENTITY_PERMISSION_DENIED,
        `Missing permission "${metadata.resource}:${metadata.action}"`,
      );
    }

    return true;
  }
}
