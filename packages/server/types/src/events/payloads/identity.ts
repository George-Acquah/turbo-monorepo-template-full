import { IdentityEvents } from '../domain-events.constants';

// Staff/admin RBAC facts — never carry secrets/hashes (clientSecretHash,
// keyHash) in any payload; those never leave modules/identity.

export interface RoleAssignedPayload {
  readonly userId: string;
  readonly roleId: string;
  readonly roleKey: string;
  readonly grantedBy?: string;
  readonly expiresAt?: string;
}

/** V2: adds `email` so a real "role assigned" email can be sent to the
 * staff/admin recipient — the plain V1 fact is ids-only. See the event
 * constant's own doc comment for why this is a version bump, not an edit. */
export interface RoleAssignedV2Payload extends RoleAssignedPayload {
  readonly email?: string;
}

export interface RoleRevokedPayload {
  readonly userId: string;
  readonly roleId: string;
  readonly roleKey: string;
  readonly revokedBy?: string;
}

/** V2: adds `email`, same rationale as `RoleAssignedV2Payload`. */
export interface RoleRevokedV2Payload extends RoleRevokedPayload {
  readonly email?: string;
}

export interface PermissionGrantedToRolePayload {
  readonly roleId: string;
  readonly roleKey: string;
  readonly permissionId: string;
  readonly permissionKey: string;
  readonly grantedByUserId?: string;
}

export interface PermissionRevokedFromRolePayload {
  readonly roleId: string;
  readonly roleKey: string;
  readonly permissionId: string;
  readonly permissionKey: string;
}

export interface ApiKeyCreatedPayload {
  readonly apiKeyId: string;
  readonly apiClientId: string;
  readonly name: string;
  readonly scopes: string[];
}

export interface ApiKeyRevokedPayload {
  readonly apiKeyId: string;
  readonly apiClientId: string;
}

export interface IdentityEventsMap {
  [IdentityEvents.ROLE_ASSIGNED]: RoleAssignedPayload;
  [IdentityEvents.ROLE_ASSIGNED_V2]: RoleAssignedV2Payload;
  [IdentityEvents.ROLE_REVOKED]: RoleRevokedPayload;
  [IdentityEvents.ROLE_REVOKED_V2]: RoleRevokedV2Payload;
  [IdentityEvents.PERMISSION_GRANTED_TO_ROLE]: PermissionGrantedToRolePayload;
  [IdentityEvents.PERMISSION_REVOKED_FROM_ROLE]: PermissionRevokedFromRolePayload;
  [IdentityEvents.API_KEY_CREATED]: ApiKeyCreatedPayload;
  [IdentityEvents.API_KEY_REVOKED]: ApiKeyRevokedPayload;
}
