/**
 * Controller paths, kept in their own file (not auth.routes.ts) so controllers can import them
 * without a cycle through auth.routes.ts → user-preferences.module.ts → preferences.controller.ts
 * → auth.routes.ts — the same fix already applied to modules/identity and modules/profiles.
 */
export const AUTH_CONTROLLER_PATHS = {
  AUTH: 'auth',
  PREFERENCES: 'preferences',
} as const;
