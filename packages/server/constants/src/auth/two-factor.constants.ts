export const TwoFactorMethod = {
  TOTP: 'TOTP',
  SMS: 'SMS',
  EMAIL: 'EMAIL',
} as const;

export type TwoFactorMethod = (typeof TwoFactorMethod)[keyof typeof TwoFactorMethod];
