import { Module } from '@nestjs/common';
import { IdentityPersistenceModule } from '@workspace/identity-persistence';
import { PermissionsModule } from '@workspace/permissions';
import { CreatePermissionUseCase } from './application/permissions/use-cases/create-permission.use-case';
import { UpdatePermissionUseCase } from './application/permissions/use-cases/update-permission.use-case';
import { ListPermissionsUseCase } from './application/permissions/use-cases/list-permissions.use-case';
import { CreateRoleUseCase } from './application/roles/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from './application/roles/use-cases/update-role.use-case';
import { ListRolesUseCase } from './application/roles/use-cases/list-roles.use-case';
import { GetRoleUseCase } from './application/roles/use-cases/get-role.use-case';
import { DeleteRoleUseCase } from './application/roles/use-cases/delete-role.use-case';
import { AssignPermissionToRoleUseCase } from './application/roles/use-cases/assign-permission-to-role.use-case';
import { RevokePermissionFromRoleUseCase } from './application/roles/use-cases/revoke-permission-from-role.use-case';
import { GetRolePermissionsUseCase } from './application/roles/use-cases/get-role-permissions.use-case';
import { AssignRoleToUserUseCase } from './application/user-roles/use-cases/assign-role-to-user.use-case';
import { RevokeRoleFromUserUseCase } from './application/user-roles/use-cases/revoke-role-from-user.use-case';
import { GetUserActiveRolesUseCase } from './application/user-roles/use-cases/get-user-active-roles.use-case';
import { CreateApiClientUseCase } from './application/api-clients/use-cases/create-api-client.use-case';
import { UpdateApiClientUseCase } from './application/api-clients/use-cases/update-api-client.use-case';
import { ListApiClientsUseCase } from './application/api-clients/use-cases/list-api-clients.use-case';
import { GetApiClientUseCase } from './application/api-clients/use-cases/get-api-client.use-case';
import { RevokeApiClientUseCase } from './application/api-clients/use-cases/revoke-api-client.use-case';
import { CreateApiKeyUseCase } from './application/api-keys/use-cases/create-api-key.use-case';
import { RevokeApiKeyUseCase } from './application/api-keys/use-cases/revoke-api-key.use-case';
import { ListClientKeysUseCase } from './application/api-keys/use-cases/list-client-keys.use-case';
import { ApiKeyGuard } from './presentation/guards/api-key.guard';
import { PermissionsController } from './presentation/controllers/permissions.controller';
import { RolesController } from './presentation/controllers/roles.controller';
import { UserRolesController } from './presentation/controllers/user-roles.controller';
import { ApiClientsController } from './presentation/controllers/api-clients.controller';
import { ApiKeysController } from './presentation/controllers/api-keys.controller';
import { MeController } from './presentation/controllers/me.controller';

/**
 * Composition root for the identity bounded-context module (staff/admin RBAC
 * + machine API credentials). IdentityPersistenceModule is not @Global(), so
 * every consumer needs this import — same pattern as auth's AuthModule.
 *
 * EVENT_PUBLISHER_TOKEN, TRANSACTION_PORT_TOKEN, CACHE_PORT_TOKEN, and
 * HASH_PORT_TOKEN come from already-global modules (EventsPublisherModule,
 * CacheModule, AuthCoreModule) wired at the app root — no new dependency or
 * module wiring needed here.
 */
@Module({
  imports: [IdentityPersistenceModule, PermissionsModule],
  controllers: [
    PermissionsController,
    RolesController,
    UserRolesController,
    ApiClientsController,
    ApiKeysController,
    MeController,
  ],
  providers: [
    CreatePermissionUseCase,
    UpdatePermissionUseCase,
    ListPermissionsUseCase,

    CreateRoleUseCase,
    UpdateRoleUseCase,
    ListRolesUseCase,
    GetRoleUseCase,
    DeleteRoleUseCase,
    AssignPermissionToRoleUseCase,
    RevokePermissionFromRoleUseCase,
    GetRolePermissionsUseCase,

    AssignRoleToUserUseCase,
    RevokeRoleFromUserUseCase,
    GetUserActiveRolesUseCase,

    CreateApiClientUseCase,
    UpdateApiClientUseCase,
    ListApiClientsUseCase,
    GetApiClientUseCase,
    RevokeApiClientUseCase,

    CreateApiKeyUseCase,
    RevokeApiKeyUseCase,
    ListClientKeysUseCase,

    ApiKeyGuard,
  ],
})
export class IdentityModule {}
