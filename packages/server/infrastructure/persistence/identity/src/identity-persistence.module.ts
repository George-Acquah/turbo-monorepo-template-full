import { Module } from '@nestjs/common';
import { PrismaModule } from '@workspace/prisma';
import { PermissionQuery, RoleQuery, ApiClientQuery, ApiKeyQuery } from './queries';
import { IDENTITY_PERSISTENCE_ADAPTERS, IDENTITY_PERSISTENCE_TOKENS } from './providers';

export * from './queries';
export * from './converter';
export * from './adapters';

/**
 * Implements the workspace_identity ports (Permission, Role, UserRole,
 * ApiClient, ApiKey) against Prisma. Single-tenant platform RBAC only —
 * members get no identity role; their content access is authorized by
 * workspace_memberships.AccessGrant instead.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    PermissionQuery,
    RoleQuery,
    ApiClientQuery,
    ApiKeyQuery,
    ...IDENTITY_PERSISTENCE_ADAPTERS,
  ],
  exports: [...IDENTITY_PERSISTENCE_TOKENS],
})
export class IdentityPersistenceModule {}
