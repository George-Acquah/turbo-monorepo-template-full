import { RateLimitRequestContext, RateLimitDecision } from '@workspace/types';

/**
 * Rate limit port (Redis-backed implementation in @workspace/rate-limit).
 * Designed to be transport-agnostic (HTTP, GraphQL, workers, etc.).
 */
export abstract class RateLimitPort {
  abstract check(ctx: RateLimitRequestContext): Promise<RateLimitDecision>;
}

export const RATE_LIMIT_TOKEN = Symbol('RATE_LIMIT_TOKEN');
