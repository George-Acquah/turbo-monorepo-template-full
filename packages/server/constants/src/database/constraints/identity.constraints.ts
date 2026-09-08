import { enumConstraint } from '../builders';
import { Schemas, Tables } from '../postgres.constants';
import { ApiClientStatus, ApiKeyStatus } from '../../identity';

// Only ApiClient.status and ApiKey.status carry /// @check comments in
// identity.prisma. Role/Permission/RolePermission/UserRole have no DB-level
// enum checks — RBAC scope/tenant/school columns were removed in the
// single-tenant rewrite (doc 03 §2.2).
export const IdentityConstraints = [
  enumConstraint({
    schema: Schemas.IDENTITY,
    table: Tables.API_CLIENTS,
    column: 'status',
    values: ApiClientStatus,
  }),
  enumConstraint({
    schema: Schemas.IDENTITY,
    table: Tables.API_KEYS,
    column: 'status',
    values: ApiKeyStatus,
  }),
] as const;
