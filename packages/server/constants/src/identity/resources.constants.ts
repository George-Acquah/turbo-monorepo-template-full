export const ApiClientStatus = {
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  SUSPENDED: 'SUSPENDED',
} as const;

export type ApiClientStatus = (typeof ApiClientStatus)[keyof typeof ApiClientStatus];

export const ApiKeyStatus = {
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
} as const;

export type ApiKeyStatus = (typeof ApiKeyStatus)[keyof typeof ApiKeyStatus];
