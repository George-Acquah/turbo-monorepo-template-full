import type { DatabaseTx } from '../shared';

export type AuthProvider = 'EMAIL' | 'GOOGLE' | 'GITHUB' | 'APPLE' | 'PHONE';

export interface AuthUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  status: string;
  passwordHash?: string | null;
  emailVerified?: boolean;
}

export interface ProviderIdentity {
  provider: AuthProvider;
  providerId: string;
  email?: string | null;
}

export abstract class AuthRepositoryPort {
  abstract findUserById(id: string): Promise<AuthUser | null>;
  abstract findUserByEmail(email: string): Promise<AuthUser | null>;
  abstract findUserByProviderIdentity(identity: ProviderIdentity): Promise<AuthUser | null>;
  abstract linkProviderIdentity(
    params: {
      userId: string;
      identity: ProviderIdentity;
    },
    tx?: DatabaseTx,
  ): Promise<void>;
  abstract upsertRefreshSession(
    params: {
      userId: string;
      deviceId: string;
      refreshTokenHash: string;
      jti: string;
      expiresAt: Date;
      ipAddress?: string | null;
      userAgent?: string | null;
    },
    tx?: DatabaseTx,
  ): Promise<void>;
  abstract getRefreshSession(
    params: {
      userId: string;
      deviceId: string;
    },
    tx?: DatabaseTx,
  ): Promise<{ refreshTokenHash: string; jti: string; expiresAt: Date } | null>;
  abstract revokeRefreshSession(
    params: { userId: string; deviceId: string },
    tx?: DatabaseTx,
  ): Promise<void>;
  abstract recordLoginSuccess(
    params: { userId: string; ipAddress?: string | null },
    tx?: DatabaseTx,
  ): Promise<void>;
  abstract recordLoginFailure(params: { userId: string }, tx?: DatabaseTx): Promise<void>;
}

export const AUTH_REPO_TOKEN = Symbol('AUTH_REPO_TOKEN');
export const PRISMA_AUTH_REPO_TOKEN = Symbol('PRISMA_AUTH_REPO_TOKEN');
