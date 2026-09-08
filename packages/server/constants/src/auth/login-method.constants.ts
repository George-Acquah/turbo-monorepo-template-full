/**
 * Login methods used in audit logs and session tracking.
 * Distinct from AuthProvider — this captures HOW the login occurred.
 */
export const LoginMethod = {
  PASSWORD: 'PASSWORD',
  MAGIC_LINK: 'MAGIC_LINK',
  OAUTH: 'OAUTH',
  SAML: 'SAML',
  OIDC: 'OIDC',
  TWO_FACTOR: 'TWO_FACTOR',
  API_KEY: 'API_KEY',
} as const;

export type LoginMethod = (typeof LoginMethod)[keyof typeof LoginMethod];
