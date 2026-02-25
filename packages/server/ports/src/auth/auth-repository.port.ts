export type AuthProvider = 'EMAIL' | 'GOOGLE' | 'GITHUB' | 'APPLE' | 'PHONE';

export interface AuthUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: string; // map UserRole
  status: string; // map UserStatus
  passwordHash?: string | null;
  emailVerified?: boolean;
}

export interface ProviderIdentity {
  provider: AuthProvider;
  providerId: string; // schema uses providerId
  email?: string | null;
}

export abstract class AuthRepositoryPort {
  abstract findUserById(id: string): Promise<AuthUser | null>;
  abstract findUserByEmail(email: string): Promise<AuthUser | null>;

  abstract findUserByProviderIdentity(identity: ProviderIdentity): Promise<AuthUser | null>;
  abstract linkProviderIdentity(params: {
    userId: string;
    identity: ProviderIdentity;
  }): Promise<void>;

  // refresh session rotation
  abstract upsertRefreshSession(params: {
    userId: string;
    deviceId: string;
    refreshTokenHash: string;
    jti: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void>;

  abstract getRefreshSession(params: {
    userId: string;
    deviceId: string;
  }): Promise<{ refreshTokenHash: string; jti: string; expiresAt: Date } | null>;

  abstract revokeRefreshSession(params: { userId: string; deviceId: string }): Promise<void>;

  // optional: update last login / failed login count / lockouts
  abstract recordLoginSuccess(params: { userId: string; ipAddress?: string | null }): Promise<void>;
  abstract recordLoginFailure(params: { userId: string }): Promise<void>;
}
export const AUTH_REPO_TOKEN = Symbol('AUTH_REPO_TOKEN');
