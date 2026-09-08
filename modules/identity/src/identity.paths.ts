/**
 * Identity has no single shared sub-path — it's five independent top-level
 * resources (permissions, roles, user-roles, api-clients, api-keys), each
 * declaring its own path via these consts on its own `@Controller(...)`.
 * Kept in its own file (not identity.routes.ts) so controllers can import it
 * without a cycle through identity.module.ts → controllers → identity.routes.ts
 * → identity.module.ts.
 */
export const IDENTITY_CONTROLLER_PATHS = {
  PERMISSIONS: 'permissions',
  ROLES: 'roles',
  USER_ROLES: 'user-roles',
  API_CLIENTS: 'api-clients',
  API_KEYS: 'api-keys',
  ME: 'me',
} as const;
