import { UserType } from '@workspace/constants';

export type AuthProviderType = 'local';
export type AuthTokenType = 'access' | 'refresh';

export interface AccessTokenClaims {
  sub: string; // User ID
  jti: string; // Unique Session ID
  userType: UserType; // Basic Role
}

export interface AuthenticatedJwtPayload extends AccessTokenClaims {
  exp?: number;
  iat?: number;
  nbf?: number;
  sessionId?: string;
  // [key: string]: unknown;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
