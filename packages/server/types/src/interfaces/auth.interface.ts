export interface AccessTokenClaims {
  sub: string;
  tenantId?: string;
  roles?: string[];
  jti?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
