import type { Provider } from '@nestjs/common';
import {
  USER_REPOSITORY_TOKEN,
  PRISMA_USER_REPOSITORY_TOKEN,
  USER_AUTH_PROVIDER_REPOSITORY_TOKEN,
  PRISMA_USER_AUTH_PROVIDER_REPOSITORY_TOKEN,
  USER_PREFERENCE_REPOSITORY_TOKEN,
  PRISMA_USER_PREFERENCE_REPOSITORY_TOKEN,
  USER_SESSION_REPOSITORY_TOKEN,
  PRISMA_USER_SESSION_REPOSITORY_TOKEN,
  USER_DEVICE_REPOSITORY_TOKEN,
  PRISMA_USER_DEVICE_REPOSITORY_TOKEN,
  PASSWORD_RESET_TOKEN_REPOSITORY_TOKEN,
  PRISMA_PASSWORD_RESET_TOKEN_REPOSITORY_TOKEN,
  EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN,
  PRISMA_EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN,
  TWO_FACTOR_ENROLLMENT_REPOSITORY_TOKEN,
  PRISMA_TWO_FACTOR_ENROLLMENT_REPOSITORY_TOKEN,
  PENDING_INVITATION_REPOSITORY_TOKEN,
  PRISMA_PENDING_INVITATION_REPOSITORY_TOKEN,
  ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN,
  PRISMA_ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN,
} from '@workspace/ports';
import {
  PrismaUserAdapter,
  PrismaUserAuthProviderAdapter,
  PrismaUserPreferenceAdapter,
  PrismaUserSessionAdapter,
  PrismaUserDeviceAdapter,
  PrismaPasswordResetTokenAdapter,
  PrismaEmailVerificationTokenAdapter,
  PrismaTwoFactorEnrollmentAdapter,
  PrismaPendingInvitationAdapter,
  PrismaAccountClaimTokenAdapter,
} from '../adapters';

// Each adapter is bound to its Prisma-specific token AND aliased to the
// neutral token, per the dual-token convention already established across
// @workspace/ports (business modules inject the neutral token; this package
// decides which concrete implementation satisfies it).
export const AUTH_PERSISTENCE_ADAPTERS: Provider[] = [
  PrismaUserAdapter,
  { provide: PRISMA_USER_REPOSITORY_TOKEN, useExisting: PrismaUserAdapter },
  { provide: USER_REPOSITORY_TOKEN, useExisting: PrismaUserAdapter },

  PrismaUserAuthProviderAdapter,
  {
    provide: PRISMA_USER_AUTH_PROVIDER_REPOSITORY_TOKEN,
    useExisting: PrismaUserAuthProviderAdapter,
  },
  { provide: USER_AUTH_PROVIDER_REPOSITORY_TOKEN, useExisting: PrismaUserAuthProviderAdapter },

  PrismaUserPreferenceAdapter,
  {
    provide: PRISMA_USER_PREFERENCE_REPOSITORY_TOKEN,
    useExisting: PrismaUserPreferenceAdapter,
  },
  { provide: USER_PREFERENCE_REPOSITORY_TOKEN, useExisting: PrismaUserPreferenceAdapter },

  PrismaUserSessionAdapter,
  { provide: PRISMA_USER_SESSION_REPOSITORY_TOKEN, useExisting: PrismaUserSessionAdapter },
  { provide: USER_SESSION_REPOSITORY_TOKEN, useExisting: PrismaUserSessionAdapter },

  PrismaUserDeviceAdapter,
  { provide: PRISMA_USER_DEVICE_REPOSITORY_TOKEN, useExisting: PrismaUserDeviceAdapter },
  { provide: USER_DEVICE_REPOSITORY_TOKEN, useExisting: PrismaUserDeviceAdapter },

  PrismaPasswordResetTokenAdapter,
  {
    provide: PRISMA_PASSWORD_RESET_TOKEN_REPOSITORY_TOKEN,
    useExisting: PrismaPasswordResetTokenAdapter,
  },
  {
    provide: PASSWORD_RESET_TOKEN_REPOSITORY_TOKEN,
    useExisting: PrismaPasswordResetTokenAdapter,
  },

  PrismaEmailVerificationTokenAdapter,
  {
    provide: PRISMA_EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN,
    useExisting: PrismaEmailVerificationTokenAdapter,
  },
  {
    provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN,
    useExisting: PrismaEmailVerificationTokenAdapter,
  },

  PrismaTwoFactorEnrollmentAdapter,
  {
    provide: PRISMA_TWO_FACTOR_ENROLLMENT_REPOSITORY_TOKEN,
    useExisting: PrismaTwoFactorEnrollmentAdapter,
  },
  {
    provide: TWO_FACTOR_ENROLLMENT_REPOSITORY_TOKEN,
    useExisting: PrismaTwoFactorEnrollmentAdapter,
  },

  PrismaPendingInvitationAdapter,
  {
    provide: PRISMA_PENDING_INVITATION_REPOSITORY_TOKEN,
    useExisting: PrismaPendingInvitationAdapter,
  },
  { provide: PENDING_INVITATION_REPOSITORY_TOKEN, useExisting: PrismaPendingInvitationAdapter },

  PrismaAccountClaimTokenAdapter,
  {
    provide: PRISMA_ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN,
    useExisting: PrismaAccountClaimTokenAdapter,
  },
  { provide: ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN, useExisting: PrismaAccountClaimTokenAdapter },
];

export const AUTH_PERSISTENCE_TOKENS = [
  USER_REPOSITORY_TOKEN,
  USER_AUTH_PROVIDER_REPOSITORY_TOKEN,
  USER_PREFERENCE_REPOSITORY_TOKEN,
  USER_SESSION_REPOSITORY_TOKEN,
  USER_DEVICE_REPOSITORY_TOKEN,
  PASSWORD_RESET_TOKEN_REPOSITORY_TOKEN,
  EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN,
  TWO_FACTOR_ENROLLMENT_REPOSITORY_TOKEN,
  PENDING_INVITATION_REPOSITORY_TOKEN,
  ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN,
];
