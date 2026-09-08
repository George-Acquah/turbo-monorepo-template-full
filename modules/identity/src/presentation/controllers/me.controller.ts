import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@workspace/guards';
import { PermissionResolverService } from '@workspace/permissions';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { IDENTITY_CONTROLLER_PATHS } from '../../identity.paths';

/**
 * The caller's own identity. `GET /me/permissions` returns the resolved permission
 * key set for the authenticated user — the source the backoffice shell uses to gate
 * navigation and page compositions server-side. Enforcement of individual routes
 * still happens on the backend (`PermissionsGuard`); this is only for the UI to hide
 * what the caller can't use.
 *
 * Self-service read — `JwtAuthGuard` only. Resolves live (cached, bustable), never a
 * JWT claim, via the shared `PermissionResolverService` (already wired into this module
 * for the permission guard).
 */
@ApiTags('Identity — Me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(IDENTITY_CONTROLLER_PATHS.ME)
export class MeController {
  constructor(
    private readonly permissionResolver: PermissionResolverService,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  @Get('permissions')
  @ApiOperation({ summary: "List the caller's resolved permission keys" })
  @ApiResponse({ status: 200, type: [String] })
  async permissions(): Promise<string[]> {
    const permissions = await this.permissionResolver.getPermissionsForUser(this.context.getUserId());
    return [...permissions].sort();
  }
}
