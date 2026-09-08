/**
 * Immediate token revocation, keyed by the token's `jti` (session id). Used
 * on logout to invalidate an access token before its natural expiry — the
 * JWT access strategy checks this on every authenticated request.
 */
export abstract class TokenBlacklistPort {
  abstract isBlacklisted(jti: string): Promise<boolean>;
  abstract blacklist(jti: string, ttlSeconds: number): Promise<void>;
  abstract assertNotBlacklisted(jti: string): Promise<void>;
}

export const TOKEN_BLACKLIST_PORT_TOKEN = Symbol('TOKEN_BLACKLIST_PORT_TOKEN');
