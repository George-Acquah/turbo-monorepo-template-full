export type RateLimitDecision =
  | {
      allowed: true;
      limit: number;
      remaining: number;
      resetAtEpochSeconds: number;
    }
  | {
      allowed: false;
      limit: number;
      remaining: 0;
      resetAtEpochSeconds: number;
      retryAfterSeconds: number;
    };

export interface RateLimitPolicy {
  /** max requests allowed in the window */
  limit: number;
  /** window size (seconds) */
  windowSeconds: number;
  /**
   * policy namespace to control keying (e.g. "api", "auth", "email").
   * also maps naturally to your RedisKeyPrefixes.RATE_LIMIT.*.
   */
  keyPrefix: string;
  /** optionally add a stable route key to avoid per-url explosion */
  routeKey?: string;
}

export interface RateLimitRequestContext {
  tracker: string; // tenantId ?? userId ?? ip
  routeKey?: string; // controller+handler or custom
  policy: RateLimitPolicy;
}
