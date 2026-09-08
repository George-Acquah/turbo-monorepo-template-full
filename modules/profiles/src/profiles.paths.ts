/**
 * Profiles is two independent top-level resources (account, consents), each
 * declaring its own path via these consts on its own `@Controller(...)`.
 * Kept in its own file (not profiles.routes.ts) so controllers can import it
 * without a cycle through profiles.module.ts → controllers → profiles.routes.ts
 * → profiles.module.ts (same fix already applied to modules/identity).
 */
export const PROFILES_CONTROLLER_PATHS = {
  ACCOUNT: 'account',
  CONSENTS: 'consents',
} as const;
