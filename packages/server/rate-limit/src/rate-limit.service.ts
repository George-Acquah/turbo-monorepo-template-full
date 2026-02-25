import { Inject, Injectable } from '@nestjs/common';
import { RATE_LIMIT_TOKEN, RateLimitPort } from '@repo/ports';
import { REDIS_PORT_TOKEN, RedisPort, LOGGER_TOKEN, type LoggerPort } from '@repo/ports';
import { RedisKeyPrefixes } from '@repo/constants';
import type { RateLimitRequestContext, RateLimitDecision } from '@repo/types/interfaces';

/**
 * Redis + Lua sliding-window rate limiter.
 *
 * Data model:
 * - Key: ratelimit:<namespace>:<tracker>:<routeKey>
 * - ZSET member: "<nowMs>-<rand>"
 * - ZSET score: nowMs
 *
 * Lua ensures atomicity:
 * 1) prune old scores
 * 2) count
 * 3) if under limit: add + set TTL
 * 4) return allowed + counts + reset
 */
const LUA_SLIDING_WINDOW = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local ttlSec = tonumber(ARGV[5])

-- prune old
redis.call('ZREMRANGEBYSCORE', key, 0, now - windowMs)

local count = redis.call('ZCARD', key)

if count >= limit then
  -- compute reset: earliest timestamp + window
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldestScore = nil
  if oldest and #oldest >= 2 then
    oldestScore = tonumber(oldest[2])
  end
  local resetAtMs = (oldestScore ~= nil) and (oldestScore + windowMs) or (now + windowMs)
  local retryAfterSec = math.max(0, math.floor((resetAtMs - now + 999) / 1000))
  return {0, count, resetAtMs, retryAfterSec}
end

redis.call('ZADD', key, now, member)
redis.call('EXPIRE', key, ttlSec)

local newCount = count + 1
local resetAtMs = now + windowMs
return {1, newCount, resetAtMs, 0}
`;

@Injectable()
export class RateLimitService extends RateLimitPort {
  private readonly context = RateLimitService.name;

  constructor(
    @Inject(REDIS_PORT_TOKEN) private readonly redis: RedisPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {
    super();
  }

  async check(ctx: RateLimitRequestContext): Promise<RateLimitDecision> {
    const nowMs = Date.now();
    const windowMs = ctx.policy.windowSeconds * 1000;

    const key = this.buildKey(ctx);
    const member = `${nowMs}-${Math.random().toString(16).slice(2)}`;
    const ttlSec = Math.max(ctx.policy.windowSeconds + 5, 5);

    const res = await this.redis.eval<[number, number, number, number]>(
      LUA_SLIDING_WINDOW,
      [key],
      [nowMs, windowMs, ctx.policy.limit, member, ttlSec],
    );

    const allowed = res?.[0] === 1;
    const countOrNewCount = Number(res?.[1] ?? 0);
    const resetAtMs = Number(res?.[2] ?? nowMs + windowMs);
    const retryAfterSeconds = Number(res?.[3] ?? 0);

    const resetAtEpochSeconds = Math.ceil(resetAtMs / 1000);

    if (allowed) {
      return {
        allowed: true,
        limit: ctx.policy.limit,
        remaining: Math.max(0, ctx.policy.limit - countOrNewCount),
        resetAtEpochSeconds,
      };
    }

    return {
      allowed: false,
      limit: ctx.policy.limit,
      remaining: 0,
      resetAtEpochSeconds,
      retryAfterSeconds: Math.max(1, retryAfterSeconds || 1),
    };
  }

  private buildKey(ctx: RateLimitRequestContext): string {
    // map policy.keyPrefix to your centralized prefixes where possible
    const prefix = this.normalizePrefix(ctx.policy.keyPrefix);

    const route = (ctx.routeKey || ctx.policy.routeKey || 'global').replace(/\s+/g, '_');
    const tracker = (ctx.tracker || 'anonymous').replace(/\s+/g, '_');

    return `${prefix}:${tracker}:${route}`;
  }

  private normalizePrefix(policyPrefix: string): string {
    const v = (policyPrefix || '').toLowerCase();

    // best-effort mapping to your constants
    if (v === 'api') return `${RedisKeyPrefixes.RATE_LIMIT.API}`;
    if (v === 'auth') return `${RedisKeyPrefixes.RATE_LIMIT.AUTH}`;
    if (v === 'email') return `${RedisKeyPrefixes.RATE_LIMIT.EMAIL}`;

    // fallback: still under ratelimit namespace
    return `ratelimit:${v || 'default'}`;
  }
}

// bind to RATE_LIMIT_TOKEN for convenience
export const RateLimitProvider = {
  provide: RATE_LIMIT_TOKEN,
  useExisting: RateLimitService,
};
