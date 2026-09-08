import type { PrismaClient } from '@workspace/prisma/client';
import { id } from '../utils/id.js';

/**
 * RBAC reference data — roles/permissions straight from identity.prisma's
 * own header comment: "Workspace roles are platform-level only:
 * platform_admin | platform_support | platform_auditor | mentor. MEMBERS
 * get NO identity role — their content access is authorized by
 * workspace_memberships.AccessGrant, never by RBAC."
 *
 * Permission keys are "<resource>:<action>", built from the real Action
 * (packages/server/constants/src/actions.constants.ts) and Resource
 * (packages/server/constants/src/identity/permissions.constants.ts)
 * constants — not invented.
 *
 * The authoritative check that this list is complete: every `@RequirePermission`
 * decorator across `modules/**` + `apps/api/src` must map to a key seeded here
 * (`grep -rn "@RequirePermission(" modules apps/api/src`). A missing key fails
 * closed — even `platform_admin` gets 403 — so this must stay in sync with the
 * controllers. Apply changes with `pnpm --filter @workspace/seed seed` (the Prisma
 * CLI is currently broken in this workspace, but the tsx seed runner is not — it
 * only needs `@prisma/client` at runtime, and the upserts below are idempotent).
 */
const PERMISSIONS: Array<{ key: string; resource: string; action: string; description: string }> = [
  // AUTH - Intentionally omits LIST/READ as it represents platform-level auth configuration rather than a collection.
  { key: 'auth:manage', resource: 'AUTH', action: 'MANAGE', description: 'Manage authentication configuration' },

  // SESSION
  { key: 'session:list', resource: 'SESSION', action: 'LIST', description: 'List sessions' },
  { key: 'session:read', resource: 'SESSION', action: 'READ', description: 'View a session' },
  { key: 'session:revoke', resource: 'SESSION', action: 'REVOKE', description: 'Revoke a session' },

  // USER
  { key: 'user:list', resource: 'USER', action: 'LIST', description: 'List users' },
  { key: 'user:read', resource: 'USER', action: 'READ', description: 'View a user' },
  { key: 'user:create', resource: 'USER', action: 'CREATE', description: 'Create a user' },
  { key: 'user:update', resource: 'USER', action: 'UPDATE', description: 'Update a user' },
  { key: 'user:manage', resource: 'USER', action: 'MANAGE', description: 'Manage a user' },

  // ROLE
  { key: 'role:list', resource: 'ROLE', action: 'LIST', description: 'List roles' },
  { key: 'role:read', resource: 'ROLE', action: 'READ', description: 'View a role' },
  { key: 'role:create', resource: 'ROLE', action: 'CREATE', description: 'Create a role' },
  { key: 'role:update', resource: 'ROLE', action: 'UPDATE', description: 'Update a role' },
  { key: 'role:delete', resource: 'ROLE', action: 'DELETE', description: 'Delete a role' },
  { key: 'role:manage', resource: 'ROLE', action: 'MANAGE', description: 'Manage a role' },

  // PERMISSION - most rows are system-defined, but permissions.controller.ts exposes
  // POST/PATCH (gated on permission:manage) for authoring non-system permissions.
  { key: 'permission:list', resource: 'PERMISSION', action: 'LIST', description: 'List permissions' },
  { key: 'permission:read', resource: 'PERMISSION', action: 'READ', description: 'View a permission' },
  { key: 'permission:manage', resource: 'PERMISSION', action: 'MANAGE', description: 'Create or update a permission' },

  // NOTIFICATION
  { key: 'notification:list', resource: 'NOTIFICATION', action: 'LIST', description: 'List notifications' },
  { key: 'notification:read', resource: 'NOTIFICATION', action: 'READ', description: 'View a notification' },
  { key: 'notification:send', resource: 'NOTIFICATION', action: 'SEND', description: 'Send a notification' },

  // AUDIT
  { key: 'audit:list', resource: 'AUDIT', action: 'LIST', description: 'List audit log entries' },
  { key: 'audit:read', resource: 'AUDIT', action: 'READ', description: 'View an audit log entry' },
  // Audit logs are append-only by the system; no create/update/delete.

  // CATALOG
  { key: 'catalog:list', resource: 'CATALOG', action: 'LIST', description: 'List catalog items' },
  { key: 'catalog:read', resource: 'CATALOG', action: 'READ', description: 'View a catalog item' },
  { key: 'catalog:write', resource: 'CATALOG', action: 'WRITE', description: 'Write a catalog item' },

  // LEARNING
  { key: 'learning:list', resource: 'LEARNING', action: 'LIST', description: 'List learning resources' },
  { key: 'learning:read', resource: 'LEARNING', action: 'READ', description: 'View a learning resource' },
  { key: 'learning:write', resource: 'LEARNING', action: 'WRITE', description: 'Create or update courses, modules, and lessons' },
  { key: 'learning:manage', resource: 'LEARNING', action: 'MANAGE', description: 'Manage a learning resource' },

  // EVENTS
  { key: 'events:list', resource: 'EVENTS', action: 'LIST', description: 'List events' },
  { key: 'events:read', resource: 'EVENTS', action: 'READ', description: 'View an event' },
  { key: 'events:write', resource: 'EVENTS', action: 'WRITE', description: 'Create, update, or replay events' },
  { key: 'events:manage', resource: 'EVENTS', action: 'MANAGE', description: 'Manage an event' },

  // ENROLMENT
  { key: 'enrolment:list', resource: 'ENROLMENT', action: 'LIST', description: 'List enrolments' },
  { key: 'enrolment:read', resource: 'ENROLMENT', action: 'READ', description: 'View an enrolment' },
  { key: 'enrolment:write', resource: 'ENROLMENT', action: 'WRITE', description: 'Manually activate an enrolment (e.g. bank transfer confirmed)' },
  { key: 'enrolment:manage', resource: 'ENROLMENT', action: 'MANAGE', description: 'Manage an enrolment' },

  // BILLING
  { key: 'billing:list', resource: 'BILLING', action: 'LIST', description: 'List billing records' },
  { key: 'billing:read', resource: 'BILLING', action: 'READ', description: 'View a billing record' },
  { key: 'billing:manage', resource: 'BILLING', action: 'MANAGE', description: 'Manage a billing record' },

  // ACCESS
  { key: 'access:list', resource: 'ACCESS', action: 'LIST', description: 'List access grants' },
  { key: 'access:read', resource: 'ACCESS', action: 'READ', description: 'View an access grant' },
  { key: 'access:write', resource: 'ACCESS', action: 'WRITE', description: 'Write an access grant' },
  { key: 'access:revoke', resource: 'ACCESS', action: 'REVOKE', description: 'Revoke an access grant' },

  // REFUND
  { key: 'refund:list', resource: 'REFUND', action: 'LIST', description: 'List refund requests' },
  { key: 'refund:read', resource: 'REFUND', action: 'READ', description: 'View a refund request' },
  { key: 'refund:request', resource: 'REFUND', action: 'REQUEST', description: 'Request a refund' },
  { key: 'refund:approve', resource: 'REFUND', action: 'APPROVE', description: 'Approve a refund' },

  // INDICATORS - ops surface for TradingView indicator products, access tasks, and link verifications.
  { key: 'indicators:list', resource: 'INDICATORS', action: 'LIST', description: 'List indicator products, access tasks, verifications, and drift' },
  { key: 'indicators:read', resource: 'INDICATORS', action: 'READ', description: 'View an indicator product' },
  { key: 'indicators:create', resource: 'INDICATORS', action: 'CREATE', description: 'Create an indicator product' },
  { key: 'indicators:manage', resource: 'INDICATORS', action: 'MANAGE', description: 'Manage indicator products and access (update, recompute, flag-abuse)' },
  { key: 'indicators:claim', resource: 'INDICATORS', action: 'CLAIM', description: 'Claim an indicator access task' },
  { key: 'indicators:confirm', resource: 'INDICATORS', action: 'CONFIRM', description: 'Confirm an indicator access task or link verification' },
  { key: 'indicators:fail', resource: 'INDICATORS', action: 'FAIL', description: 'Fail an indicator access task or reject a link verification' },

  // OPS - `ops:manage` covers mutating operational commands; `ops:list`/`ops:read` gate the
  // API client & API key read surfaces (identity api-clients/api-keys controllers).
  { key: 'ops:list', resource: 'OPS', action: 'LIST', description: 'List API clients and API keys' },
  { key: 'ops:read', resource: 'OPS', action: 'READ', description: 'View an API client' },
  { key: 'ops:manage', resource: 'OPS', action: 'MANAGE', description: 'Manage operations' },
];

const ROLES: Array<{ key: string; name: string; description: string; permissionKeys: string[] }> = [
  {
    key: 'platform_admin',
    name: 'Platform Admin',
    description: 'Full platform administration access',
    permissionKeys: PERMISSIONS.map((p) => p.key),
  },
  {
    key: 'platform_support',
    name: 'Platform Support',
    description: 'Member support — read/notify/session management',
    permissionKeys: [
      'user:list',
      'user:read',
      'session:list',
      'session:read',
      'session:revoke',
      'notification:list',
      'notification:read',
      'notification:send',
      'audit:list',
      'audit:read',
      'catalog:list',
      'catalog:read',
      'learning:list',
      'learning:read',
      'events:list',
      'events:read',
      'enrolment:list',
      'enrolment:read',
      'enrolment:write',
      'billing:list',
      'billing:read',
      'access:list',
      'access:read',
      'refund:list',
      'refund:read',
      'refund:request',
      'indicators:list',
      'indicators:read',
      'indicators:claim',
      'indicators:confirm',
      'indicators:fail',
    ],
  },
  {
    key: 'platform_auditor',
    name: 'Platform Auditor',
    description: 'Read-only access for compliance/audit review',
    permissionKeys: [
      'user:list',
      'user:read',
      'role:list',
      'role:read',
      'permission:list',
      'permission:read',
      'audit:list',
      'audit:read',
      'session:list',
      'session:read',
      'notification:list',
      'notification:read',
      'catalog:list',
      'catalog:read',
      'learning:list',
      'learning:read',
      'events:list',
      'events:read',
      'enrolment:list',
      'enrolment:read',
      'billing:list',
      'billing:read',
      'access:list',
      'access:read',
      'refund:list',
      'refund:read',
      'indicators:list',
      'indicators:read',
    ],
  },
  {
    key: 'mentor',
    name: 'Mentor',
    description: 'Trading mentor — member visibility and notifications',
    permissionKeys: [
      'user:list',
      'user:read',
      'notification:list',
      'notification:read',
      'notification:send',
      'learning:list',
      'learning:read',
      'events:list',
      'events:read',
      'catalog:list',
      'catalog:read',
    ],
  },
];

export interface IdentitySeedResult {
  roles: Record<string, string>; // roleKey -> roleId
}

export async function seedIdentity(prisma: PrismaClient): Promise<IdentitySeedResult> {
  console.log('Seeding identity (permissions, roles, role_permissions)…');

  const permissionIds: Record<string, string> = {};

  for (const perm of PERMISSIONS) {
    const row = await prisma.permission.upsert({
      where: { key: perm.key },
      create: {
        id: id('pmt'),
        key: perm.key,
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
      update: {
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
    });
    permissionIds[perm.key] = row.id;
  }

  const roleIds: Record<string, string> = {};

  for (const role of ROLES) {
    const row = await prisma.role.upsert({
      where: { key: role.key },
      create: {
        id: id('rol'),
        key: role.key,
        name: role.name,
        description: role.description,
      },
      update: {
        name: role.name,
        description: role.description,
      },
    });
    roleIds[role.key] = row.id;

    for (const permKey of role.permissionKeys) {
      const permissionId = permissionIds[permKey];
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: row.id, permissionId } },
        create: { roleId: row.id, permissionId },
        update: {},
      });
    }
  }

  console.log(`  ${PERMISSIONS.length} permissions, ${ROLES.length} roles seeded.`);

  return { roles: roleIds };
}
