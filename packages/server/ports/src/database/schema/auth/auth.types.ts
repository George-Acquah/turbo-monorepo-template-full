// ─────────────────────────────────────────────────────────────────────────────
// User Types

import {
  AccountClaimTokenStatus,
  AuthProvider,
  Currency,
  InvitationStatus,
  ThemePreference,
  TwoFactorMethod,
  UserStatus,
  UserType,
} from '@workspace/constants';
import { RepoQueryOptions } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
export interface UserPersistence {
  id: string;
  email: string | null;
  phone: string | null;
  userType: UserType;
  status: UserStatus;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  passwordHash: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  failedLoginCount: number;
  lockedUntil: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateUserInput extends Omit<
  UserPersistence,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'failedLoginCount'
  | 'emailVerified'
  | 'phoneVerified'
  | 'twoFactorEnabled'
  | 'emailVerifiedAt'
  | 'phoneVerifiedAt'
  | 'lastLoginAt'
  | 'lastLoginIp'
  | 'lockedUntil'
> {
  id?: string;
  failedLoginCount?: number;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
}

// Explicitly PICK safe fields for profile updates
export type UpdateUserProfileInput = Partial<
  Pick<
    UserPersistence,
    'firstName' | 'lastName' | 'displayName' | 'avatarUrl' | 'metadata' | 'email' | 'phone'
  >
>;

// Explicitly PICK fields for security/auth updates
export type UpdateUserSecurityInput = Partial<
  Pick<
    UserPersistence,
    | 'status'
    | 'passwordHash'
    | 'twoFactorEnabled'
    | 'failedLoginCount'
    | 'lockedUntil'
    | 'lastLoginAt'
    | 'lastLoginIp'
    | 'emailVerified'
    | 'phoneVerified'
    | 'emailVerifiedAt'
    | 'phoneVerifiedAt'
    | 'deletedAt'
  >
>;

// ─────────────────────────────────────────────────────────────────────────────
// UserAuthProvider Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserAuthProviderPersistence {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerId: string;
  email: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  tokenData: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserAuthProviderInput extends Omit<
  UserAuthProviderPersistence,
  'id' | 'createdAt' | 'updatedAt'
> {
  id?: string;
}

export type UpdateUserAuthProviderInput = Partial<
  Pick<
    UserAuthProviderPersistence,
    'accessToken' | 'refreshToken' | 'expiresAt' | 'tokenData' | 'email'
  >
>;

// ─────────────────────────────────────────────────────────────────────────────
// UserPreference Types
// ─────────────────────────────────────────────────────────────────────────────
export interface UserPreferencePersistence {
  id: string;
  userId: string;
  language: string;
  timezone: string;
  /** Display/browsing preference only — never the currency a payment is charged in. See
   *  modules/auth/src/application/dto/user-preference.dto.ts's MyPreferences comment. */
  currency: Currency;
  /** @deprecated Superseded by `theme`, which can also express "follow the device". Still
   *  written on user creation; nothing reads it. */
  darkMode: boolean;
  theme: ThemePreference;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  preferences: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserPreferenceInput extends Omit<
  UserPreferencePersistence,
  'id' | 'createdAt' | 'updatedAt'
> {
  id?: string;
}

export type UpdateUserPreferenceInput = Partial<
  Omit<UserPreferencePersistence, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

// ─────────────────────────────────────────────────────────────────────────────
// UserSession Types
// ─────────────────────────────────────────────────────────────────────────────
export interface UserSessionPersistence {
  id: string;
  userId: string;
  refreshTokenHash: string;
  jti: string;
  deviceId: string;
  deviceName: string | null;
  platform: string | null;
  browser: string | null;
  ipAddress: string | null;
  userAgent: string | null;

  expiresAt: Date;
  lastActiveAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateUserSessionInput extends Omit<
  UserSessionPersistence,
  'id' | 'createdAt' | 'lastActiveAt' | 'revokedAt'
> {
  id?: string;
}

export type UpdateUserSessionInput = Partial<
  Pick<
    UserSessionPersistence,
    'jti' | 'lastActiveAt' | 'revokedAt' | 'refreshTokenHash' | 'expiresAt'
  >
>;

// ─────────────────────────────────────────────────────────────────────────────
// UserDevice Types
// ─────────────────────────────────────────────────────────────────────────────
export interface UserDevicePersistence {
  id: string;
  userId: string;

  fingerprintHash: string;
  deviceName: string | null;
  platform: string | null;
  browser: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  trusted: boolean;
  trustedAt: Date | null;
  trustedBy: string | null;
  lastSeenAt: Date | null;
  revokedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDeviceInput extends Omit<
  UserDevicePersistence,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'trusted'
  | 'trustedAt'
  | 'trustedBy'
  | 'lastSeenAt'
  | 'revokedAt'
> {
  id?: string;
  trusted?: boolean;
}

export type UpdateUserDeviceInput = Partial<
  Pick<
    UserDevicePersistence,
    | 'trusted'
    | 'trustedAt'
    | 'trustedBy'
    | 'lastSeenAt'
    | 'revokedAt'
    | 'metadata'
    | 'deviceName'
    | 'ipAddress'
  >
>;

// ─────────────────────────────────────────────────────────────────────────────
// Token Types (Password Reset & Email Verification)
// ─────────────────────────────────────────────────────────────────────────────
export interface PasswordResetTokenPersistence {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface CreatePasswordResetTokenInput extends Omit<
  PasswordResetTokenPersistence,
  'id' | 'createdAt' | 'usedAt'
> {
  id?: string;
}

export interface EmailVerificationTokenPersistence {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreateEmailVerificationTokenInput extends Omit<
  EmailVerificationTokenPersistence,
  'id' | 'createdAt' | 'usedAt'
> {
  id?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TwoFactorEnrollment Types
// ─────────────────────────────────────────────────────────────────────────────
export interface TwoFactorEnrollmentPersistence {
  id: string;
  userId: string;
  method: TwoFactorMethod;
  secretEncrypted: string | null;
  target: string | null;
  isPrimary: boolean;
  verifiedAt: Date | null;
  lastUsedAt: Date | null;
  recoveryCodesHash: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateTwoFactorEnrollmentInput extends Omit<
  TwoFactorEnrollmentPersistence,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'isPrimary'
  | 'verifiedAt'
  | 'lastUsedAt'
  | 'recoveryCodesHash'
> {
  id?: string;
  isPrimary?: boolean;
  recoveryCodesHash?: string[];
}

export type UpdateTwoFactorEnrollmentInput = Partial<
  Pick<
    TwoFactorEnrollmentPersistence,
    | 'isPrimary'
    | 'verifiedAt'
    | 'lastUsedAt'
    | 'recoveryCodesHash'
    | 'secretEncrypted'
    | 'target'
    | 'deletedAt'
  >
>;

// ─────────────────────────────────────────────────────────────────────────────
// PendingInvitation Types
// ─────────────────────────────────────────────────────────────────────────────
export interface PendingInvitationPersistence {
  id: string;
  inviterId: string;
  email: string | null;
  phone: string | null;
  // References workspace_identity.Role.key — loose coupling, no FK.
  roleKey: string;
  status: InvitationStatus;
  verificationToken: string;
  acceptedUserId: string | null;
  expiresAt: Date;
  acceptedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePendingInvitationInput extends Omit<
  PendingInvitationPersistence,
  'id' | 'status' | 'acceptedUserId' | 'acceptedAt' | 'createdAt' | 'updatedAt'
> {
  id?: string;
  status?: InvitationStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// AccountClaimToken Types — guest → account claim (doc 06 §5). profileId is a
// loose ref to workspace_profiles.MemberProfile — no FK, same convention as
// PendingInvitation.roleKey above.
// ─────────────────────────────────────────────────────────────────────────────
export interface AccountClaimTokenPersistence {
  id: string;
  profileId: string;
  email: string;
  tokenHash: string;
  status: AccountClaimTokenStatus;
  claimedUserId: string | null;
  expiresAt: Date;
  claimedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountClaimTokenInput extends Omit<
  AccountClaimTokenPersistence,
  'id' | 'status' | 'claimedUserId' | 'claimedAt' | 'createdAt' | 'updatedAt'
> {
  id?: string;
  status?: AccountClaimTokenStatus;
}

// ───────────────────────────────────────────────────────────────────────────── Auth Query Options
export type EmailVerificationTokenPersistenceQueryOptions<
  K extends keyof EmailVerificationTokenPersistence,
> = RepoQueryOptions<EmailVerificationTokenPersistence, K>;

export type PasswordResetTokenPersistenceQueryOptions<
  K extends keyof PasswordResetTokenPersistence,
> = RepoQueryOptions<PasswordResetTokenPersistence, K>;

export type UserSessionPersistenceQueryOptions<K extends keyof UserSessionPersistence> =
  RepoQueryOptions<UserSessionPersistence, K>;

export type UserDevicePersistenceQueryOptions<K extends keyof UserDevicePersistence> =
  RepoQueryOptions<UserDevicePersistence, K>;

export type TwoFactorEnrollmentPersistenceQueryOptions<
  K extends keyof TwoFactorEnrollmentPersistence,
> = RepoQueryOptions<TwoFactorEnrollmentPersistence, K>;

export type UserAuthProviderPersistenceQueryOptions<K extends keyof UserAuthProviderPersistence> =
  RepoQueryOptions<UserAuthProviderPersistence, K>;

export type UserPreferencePersistenceQueryOptions<K extends keyof UserPreferencePersistence> =
  RepoQueryOptions<UserPreferencePersistence, K>;

export type UserPersistenceQueryOptions<K extends keyof UserPersistence> = RepoQueryOptions<
  UserPersistence,
  K
>;

export type PendingInvitationPersistenceQueryOptions<
  K extends keyof PendingInvitationPersistence,
> = RepoQueryOptions<PendingInvitationPersistence, K>;

export type AccountClaimTokenPersistenceQueryOptions<
  K extends keyof AccountClaimTokenPersistence,
> = RepoQueryOptions<AccountClaimTokenPersistence, K>;
