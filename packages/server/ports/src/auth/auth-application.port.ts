export interface UserContact {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * The sanctioned seam for another context to read a User's minimal contact
 * info without importing `ports/database/schema/auth/**` directly —
 * `UserPersistence` is auth's own aggregate (see `UserRolePersistence.userId`'s
 * own doc comment: "workspace_auth.users.id — string ref, no FK", i.e.
 * `modules/identity` deliberately does not own User data). Implemented by
 * `modules/auth` (`AuthApplicationService`), consumed by `modules/identity`'s
 * role-assignment/revocation use-cases — their `RoleAssignedV2`/`RoleRevokedV2`
 * events need the target staff/admin user's email for a real notification
 * email, and `UserRolePersistence` only carries `userId`, not contact info.
 * Mirrors `ProfilesApplicationPort.getProfileContact`'s exact shape/rationale.
 * Returns `null` on a miss rather than throwing, same "reads never throw"
 * convention as `ProfilesApplicationPort`/`CatalogApplicationPort`.
 */
export abstract class AuthApplicationPort {
  abstract getUserContact(userId: string): Promise<UserContact | null>;
}

export const AUTH_APPLICATION_TOKEN = Symbol('AUTH_APPLICATION_TOKEN');
