import { Module } from '@nestjs/common';
import { PrismaModule } from '@workspace/prisma';
import { UserQuery, SessionQuery, InvitationQuery, AccountClaimTokenQuery } from './queries';
import { AUTH_PERSISTENCE_ADAPTERS, AUTH_PERSISTENCE_TOKENS } from './providers';
import { AuthTransactions } from './transactions';

export * from './queries';
export * from './converter';
export * from './adapters';
export * from './transactions';
export * from './constants';
export * from './utils';

/**
 * Implements the 10 workspace_auth repository ports (User,
 * UserAuthProvider, UserPreference, UserSession, UserDevice,
 * PasswordResetToken, EmailVerificationToken, TwoFactorEnrollment,
 * PendingInvitation, AccountClaimToken) against Prisma. Business modules
 * import this and inject the neutral `*_REPOSITORY_TOKEN`s from
 * @workspace/ports — they never see PrismaService or the concrete adapters
 * directly.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    UserQuery,
    SessionQuery,
    InvitationQuery,
    AccountClaimTokenQuery,
    AuthTransactions,
    ...AUTH_PERSISTENCE_ADAPTERS,
  ],
  exports: [AuthTransactions, ...AUTH_PERSISTENCE_TOKENS],
})
export class AuthPersistenceModule {}
