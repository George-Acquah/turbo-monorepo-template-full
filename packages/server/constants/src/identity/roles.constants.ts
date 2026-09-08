export const SystemRoleKey = {
  // Staff/admin RBAC seed roles (doc 06 §3) — the 4 roles modules/identity
  // actually seeds. Members get no identity role.
  PLATFORM_ADMIN: 'platform_admin',
  PLATFORM_SUPPORT: 'platform_support',
  PLATFORM_AUDITOR: 'platform_auditor',
  MENTOR: 'mentor',
} as const;

export type SystemRoleKey = (typeof SystemRoleKey)[keyof typeof SystemRoleKey];
