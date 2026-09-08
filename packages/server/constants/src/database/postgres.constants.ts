import { Schemas, Tables } from './postgres.constants.generated';

// Re-export all generated constants from the Prisma schema
export {
  Schemas,
  type Schema,
  Tables,
  type Table,
  ModelToTable,
  type ModelName,
  TableToModel,
  type TableName,
} from './postgres.constants.generated';

// Application database roles. These are provisioned separately from migrations.
// Permissions are managed in build-check-constraints.mjs which emits GRANT/REVOKE
// statements during the build phase.
export const AppDatabaseRoles = {
  API: 'workspace_api',
  WORKER: 'workspace_worker',
  READONLY: 'workspace_readonly',
} as const;

export type AppDatabaseRole = (typeof AppDatabaseRoles)[keyof typeof AppDatabaseRoles];

// Append-only tables (see workspace_audit.prisma header). Once rows are written,
// application roles cannot UPDATE or DELETE them. This is enforced by REVOKE statements
// in build-check-constraints.mjs, which protects the audit trail from tampering.
export const AppendOnlyTables: ReadonlyArray<{ schema: string; table: string }> = [
  { schema: Schemas.AUDIT, table: Tables.AUDIT_LOGS },
  { schema: Schemas.AUDIT, table: Tables.SYSTEM_EVENTS },
  { schema: Schemas.AUDIT, table: Tables.API_LOGS },
  { schema: Schemas.AUDIT, table: Tables.JOB_LOGS },
  { schema: Schemas.AUDIT, table: Tables.LOGIN_ATTEMPTS },
];
