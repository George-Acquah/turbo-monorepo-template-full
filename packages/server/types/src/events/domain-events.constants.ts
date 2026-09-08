/**
 * Domain Event Catalog
 *
 * Naming: `workspace.<context>.<aggregate>.<action>` — lowercase dotted,
 * past-tense verb. The actor vocabulary lives in `@workspace/constants`
 * (`EventActorType` = user|system|worker|api) — do NOT redefine it here.
 *
 * Schema evolution: once a payload ships, it is frozen forever — never add,
 * remove, or retype a field on an existing `*Payload` interface in
 * `payloads/*.ts`. The first version of an event has no suffix (it's
 * implicitly v1). A breaking payload change mints a NEW event constant and
 * payload type instead of mutating the old one, e.g.:
 *
 *   REPORT_GENERATED: 'workspace.reports.report.generated'        // v1, frozen
 *   REPORT_GENERATED_V2: 'workspace.reports.report.generated.v2'  // ReportGeneratedV2Payload
 *
 * `packages/server/types/scripts/check-event-schema.mjs`
 * (`pnpm --filter @workspace/types check:event-schema`) enforces this by
 * snapshotting every resolved payload shape and failing if an existing
 * entry's shape drifts.
 *
 * TEMPLATE NOTE: this ships with the auth / identity / profiles / files /
 * notifications contexts only. Add a new context by (1) adding its
 * `*Events` const here, (2) spreading it into `AllEvents`, (3) adding a
 * matching `payloads/<context>.ts` + wiring it into `payloads/index.ts`.
 */

// ── auth ─────────────────────────────────────────────────────────────────────
export const AuthEvents = {
  USER_REGISTERED: 'workspace.auth.user.registered',
  ACCOUNT_CLAIMED: 'workspace.auth.account.claimed',
  EMAIL_VERIFIED: 'workspace.auth.email.verified',
  PASSWORD_RESET_REQUESTED: 'workspace.auth.password.reset_requested',
  PASSWORD_CHANGED: 'workspace.auth.password.changed',
  SESSION_CREATED: 'workspace.auth.session.created',
  SESSION_REVOKED: 'workspace.auth.session.revoked',
  TWO_FACTOR_ENABLED: 'workspace.auth.two_factor.enabled',
  TWO_FACTOR_DISABLED: 'workspace.auth.two_factor.disabled',
} as const;

// ── identity (staff/admin RBAC + machine API credentials) ────────────────────
export const IdentityEvents = {
  ROLE_ASSIGNED: 'workspace.identity.role.assigned',
  /** V2: adds `email` so a real "role assigned" email can be sent to the
   * staff/admin recipient, not just an in-app note — the plain V1 fact is
   * ids-only. See `RoleAssignedV2Payload`'s own doc comment. */
  ROLE_ASSIGNED_V2: 'workspace.identity.role.assigned.v2',
  ROLE_REVOKED: 'workspace.identity.role.revoked',
  /** V2: adds `email`, same rationale as `ROLE_ASSIGNED_V2`. */
  ROLE_REVOKED_V2: 'workspace.identity.role.revoked.v2',
  PERMISSION_GRANTED_TO_ROLE: 'workspace.identity.permission.granted_to_role',
  PERMISSION_REVOKED_FROM_ROLE: 'workspace.identity.permission.revoked_from_role',
  API_KEY_CREATED: 'workspace.identity.api_key.created',
  API_KEY_REVOKED: 'workspace.identity.api_key.revoked',
} as const;

// ── profiles ─────────────────────────────────────────────────────────────────
export const ProfilesEvents = {
  PROFILE_CREATED: 'workspace.profiles.profile.created',
  PROFILE_UPDATED: 'workspace.profiles.profile.updated',
  // Guest -> account claim completion: the profile's userId was just linked.
  // Distinct from PROFILE_CREATED/UPDATED — notifications reacts to this one
  // to send the welcome email/in-app notice, not to every profile field edit.
  PROFILE_LINKED: 'workspace.profiles.profile.linked',
  CONSENT_GRANTED: 'workspace.profiles.consent.granted',
  CONSENT_WITHDRAWN: 'workspace.profiles.consent.withdrawn',
  ERASURE_REQUESTED: 'workspace.profiles.erasure.requested',
  ERASURE_COMPLETED: 'workspace.profiles.erasure.completed',
} as const;

// ── files ────────────────────────────────────────────────────────────────────
export const FilesEvents = {
  FILE_UPLOADED: 'workspace.files.file.uploaded',
  SCAN_COMPLETED: 'workspace.files.scan.completed',
  SCAN_INFECTED: 'workspace.files.scan.infected',
  FILE_PROCESSED: 'workspace.files.file.processed',
  FILE_DELETED: 'workspace.files.file.deleted',
} as const;

// ── notifications (delivery feedback only) ───────────────────────────────────
export const NotificationsEvents = {
  EMAIL_BOUNCED: 'workspace.notifications.email.bounced',
  EMAIL_COMPLAINED: 'workspace.notifications.email.complained',
} as const;

// ── all events union ─────────────────────────────────────────────────────────
export const AllEvents = {
  ...AuthEvents,
  ...IdentityEvents,
  ...ProfilesEvents,
  ...FilesEvents,
  ...NotificationsEvents,
} as const;

export type EventType = (typeof AllEvents)[keyof typeof AllEvents];
