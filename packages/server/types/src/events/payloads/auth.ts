import { AuthEvents } from '../domain-events.constants';

// Auth events are userId-keyed (identity, not commerce). `email` appears only
// where a downstream send needs it (verification/reset).

export type UserTypeValue = 'PLATFORM_ADMIN' | 'STAFF' | 'MEMBER' | 'API_CLIENT';
export type TwoFactorMethod = 'TOTP' | 'SMS' | 'EMAIL';
export type SessionRevokeReason = 'LOGOUT' | 'ADMIN' | 'SECURITY' | 'REFRESH_ROTATION';

export interface UserRegisteredPayload {
  readonly userId: string;
  readonly email: string;
  readonly userType: UserTypeValue;
  readonly emailVerificationRequired: boolean;
}

export interface AccountClaimedPayload {
  readonly userId: string;
  readonly profileId: string;
  readonly email: string;
}

export interface EmailVerifiedPayload {
  readonly userId: string;
  readonly email: string;
}

export interface PasswordResetRequestedPayload {
  readonly userId: string;
  readonly email: string;
}

export interface PasswordChangedPayload {
  readonly userId: string;
}

export interface SessionCreatedPayload {
  readonly userId: string;
  readonly sessionId: string;
  readonly deviceId: string;
  readonly ipAddress?: string;
}

export interface SessionRevokedPayload {
  readonly userId: string;
  readonly sessionId: string;
  readonly reason?: SessionRevokeReason;
}

export interface TwoFactorEnabledPayload {
  readonly userId: string;
  readonly method: TwoFactorMethod;
}

export interface TwoFactorDisabledPayload {
  readonly userId: string;
  readonly method: TwoFactorMethod;
}

export interface AuthEventsMap {
  [AuthEvents.USER_REGISTERED]: UserRegisteredPayload;
  [AuthEvents.ACCOUNT_CLAIMED]: AccountClaimedPayload;
  [AuthEvents.EMAIL_VERIFIED]: EmailVerifiedPayload;
  [AuthEvents.PASSWORD_RESET_REQUESTED]: PasswordResetRequestedPayload;
  [AuthEvents.PASSWORD_CHANGED]: PasswordChangedPayload;
  [AuthEvents.SESSION_CREATED]: SessionCreatedPayload;
  [AuthEvents.SESSION_REVOKED]: SessionRevokedPayload;
  [AuthEvents.TWO_FACTOR_ENABLED]: TwoFactorEnabledPayload;
  [AuthEvents.TWO_FACTOR_DISABLED]: TwoFactorDisabledPayload;
}
