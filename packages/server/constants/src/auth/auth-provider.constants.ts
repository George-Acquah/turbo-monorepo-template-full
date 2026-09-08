export const AuthProvider = {
  EMAIL: 'EMAIL',
  GOOGLE: 'GOOGLE',
  APPLE: 'APPLE',
  MICROSOFT: 'MICROSOFT',
  PHONE: 'PHONE',
  SAML: 'SAML',
  OIDC: 'OIDC',
} as const;

export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];
