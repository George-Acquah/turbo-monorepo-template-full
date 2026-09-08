/**
 * Types of verification tokens/flows.
 */
export const VerificationType = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  TWO_FACTOR: 'TWO_FACTOR',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;

export type VerificationType = (typeof VerificationType)[keyof typeof VerificationType];
