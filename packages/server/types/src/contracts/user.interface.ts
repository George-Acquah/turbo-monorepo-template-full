import { SystemRoleKey } from "@workspace/constants";

export interface UserContext {
  id: string;
  email: string;
  // Most users (all MEMBER-type accounts) have no RBAC role at all — per
  // identity.prisma's own header comment, member content access is
  // authorized via memberships.AccessGrant, never RBAC. Only genuinely
  // present for platform staff with an assigned Role.
  role?: SystemRoleKey;
}
