import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT, RedisKeyPrefixes } from '@repo/constants';
import type Redis from 'ioredis';

export interface TokenBucketResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Token Bucket:
 * - capacity = limit
 * - refill rate = limit / ttlSeconds tokens per second
 * - state stored in Redis per key: { tokens, last_refill_ms }
 */
@Injectable()
export class RedisRateLimitStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private readonly script = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local now_ms = tonumber(ARGV[3])

local refill_rate = capacity / ttl

local data = redis.call("HMGET", key, "tokens", "ts")
local tokens = tonumber(data[1])
local ts = tonumber(data[2])

if tokens == nil then tokens = capacity end
if ts == nil then ts = now_ms end

local elapsed = math.max(0, now_ms - ts) / 1000
local refill = elapsed * refill_rate
tokens = math.min(capacity, tokens + refill)

local allowed = 0
if tokens >= 1 then
  allowed = 1
  tokens = tokens - 1
end

redis.call("HMSET", key, "tokens", tokens, "ts", now_ms)

-- keep key alive slightly longer than ttl so buckets don't vanish mid-window
redis.call("PEXPIRE", key, (ttl * 1000) + 2000)

local remaining = math.floor(tokens)
local reset_seconds = math.ceil((capacity - tokens) / refill_rate)

return { allowed, remaining, reset_seconds }
`;

  async consume(params: {
    scope: 'api' | 'auth' | 'email';
    identity: string; // tenantId ?? userId ?? ip (or other)
    route?: string; // optional route grouping
    limit: number;
    ttlSeconds: number;
  }): Promise<TokenBucketResult> {
    const { scope, identity, route, limit, ttlSeconds } = params;

    const prefix =
      scope === 'api'
        ? RedisKeyPrefixes.RATE_LIMIT.API
        : scope === 'auth'
          ? RedisKeyPrefixes.RATE_LIMIT.AUTH
          : RedisKeyPrefixes.RATE_LIMIT.EMAIL;

    const routePart = route ? `:${route}` : '';
    const key = `${prefix}:${identity}${routePart}`;

    const nowMs = Date.now();

    const res = (await this.redis.eval(this.script, 1, key, limit, ttlSeconds, nowMs)) as [
      number,
      number,
      number,
    ];

    const allowed = res[0] === 1;
    const remaining = res[1];
    const resetSeconds = res[2];

    return { allowed, limit, remaining, resetSeconds };
  }
}
