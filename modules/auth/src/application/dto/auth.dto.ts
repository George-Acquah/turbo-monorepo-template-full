import type { UserStatus, UserType } from '@workspace/constants';

/**
 * Application-layer (use-case) input/output shapes for the auth context.
 *
 * These are NOT HTTP DTOs — no `class-validator` decorators. HTTP request/
 * response shapes live in `presentation/dto/`. Keeping them here lets a
 * use-case be unit-tested with plain mocks, no NestJS/HTTP involved.
 */

/** Shared session/device metadata resolved from the request context. */
export interface SessionMetaInput {
  deviceId: string;
  deviceName?: string | null;
  platform?: string | null;
  browser?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RegisterInput extends SessionMetaInput {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface LoginInput extends SessionMetaInput {
  userId: string;
}

export interface RefreshTokenInput {
  userId: string;
  jti: string;
  deviceId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface LogoutInput {
  /** The authenticated principal, used for the session.revoked fact. */
  userId: string;
  /** The current session id (jti), from the authenticated access token. */
  jti: string;
  /** The access token's `exp` (epoch seconds), used as the blacklist TTL. */
  tokenExpEpochSeconds?: number;
}

export interface CurrentUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  userType: UserType;
  status: UserStatus;
  emailVerified: boolean;
}

export interface IssueSessionInput extends SessionMetaInput {
  userId: string;
  userType: UserType;
}

/** Internal-only — see IssueAccountClaimTokenUseCase's own doc comment. */
export interface IssueAccountClaimTokenInput {
  profileId: string;
  email: string;
  /** For the email greeting/copy — optional, best-effort. */
  name?: string;
  programmeName?: string;
}

export interface ClaimAccountInput extends SessionMetaInput {
  claimToken: string;
  password: string;
}

/** Issuance side of the email-verification flow — see RequestEmailVerificationUseCase. */
export interface RequestEmailVerificationInput {
  userId: string;
  email: string;
  name?: string;
}

/** Completion side — see VerifyEmailUseCase. */
export interface VerifyEmailInput {
  rawToken: string;
}

export interface VerifyEmailResult {
  email: string;
}
