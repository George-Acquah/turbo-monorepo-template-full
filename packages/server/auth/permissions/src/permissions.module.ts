import { Module } from '@nestjs/common';
import { IdentityPersistenceModule } from '@workspace/identity-persistence';
import { PermissionResolverService } from './services/permission-resolver.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Self-sufficient — imports `IdentityPersistenceModule` itself (not
 * `@Global()`, so every consumer needs it, same pattern as
 * `AuthPersistenceModule`/`modules/auth`) so any consumer just does
 * `imports: [PermissionsModule]` and gets a working resolver + guards without
 * needing to know about identity's persistence wiring.
 */
@Module({
  imports: [IdentityPersistenceModule],
  providers: [PermissionResolverService, PermissionsGuard, RolesGuard],
  exports: [PermissionResolverService, PermissionsGuard, RolesGuard],
})
export class PermissionsModule {}
