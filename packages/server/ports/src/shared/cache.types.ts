// libs/ports/src/cache/cache.types.ts

/**
 * Result of a cache-aside resolution.
 *
 * WHY THIS EXISTS:
 * The old CacheService used `T | null` as both "cache miss" and "cached value
 * was null" — indistinguishable. That meant any endpoint that legitimately
 * caches a null-ish result (e.g. "no active session for this user") could
 * never actually benefit from caching; it looked like a permanent miss.
 *
 * The new design sidesteps the ambiguity entirely: on a miss, the factory is
 * always invoked and its real return value is placed in `value` — there is no
 * sentinel. `hit` tells you whether the factory ran; `stale` tells you whether
 * the value being returned is past its fresh TTL but still within its
 * stale-while-revalidate window (a background refresh will have been kicked
 * off in that case).
 */
export interface CacheEntry<T> {
  /** True if the value came from cache (fresh or stale). False if the factory just ran. */
  hit: boolean;
  /** True if this is a stale-but-usable value being served while a refresh happens in the background. */
  stale: boolean;
  value: T;
}

/** Options accepted by CacheService.resolve() and the getOrSet* helpers. */
export interface ResolveOptions {
  /** Fresh TTL in seconds. */
  ttl: number;
  /**
   * Extra seconds beyond `ttl` during which a stale value may still be served
   * while a background refresh runs. Omit or 0 to disable stale-while-revalidate.
   */
  staleTtl?: number;
  /**
   * If true, use a short-lived distributed lock (Redis SETNX) so that only one
   * process computes a cold/expired key at a time; others wait briefly or fall
   * back to computing independently rather than blocking forever.
   *
   * NOTE: this is a simple mutual-exclusion lock (SETNX + TTL), not a full
   * Redlock implementation with fencing tokens. It is sufficient to collapse
   * a thundering herd down to a small number of concurrent computations; it
   * does not give hard linearizability guarantees. Use a real Redlock library
   * if you need that.
   */
  lock?: boolean;
  /** TTL for the lock key itself, in seconds. Defaults to 10. */
  lockTtlSeconds?: number;
  /**
   * Predicate deciding whether a freshly computed value should actually be
   * written to cache. Defaults to "always cache". Useful for e.g. not caching
   * null/not-found results.
   */
  shouldCache?: (value: unknown) => boolean;
  /** Entity/list prefix, used only for metrics/log context. */
  prefix: string;
}

/** Simpler options for direct (non-resolve) reads/writes — no locking/coalescing/SWR. */
export interface CacheOptions {
  ttl?: number;
  versioned?: boolean;
  staleTtl?: number;
}

export interface InvalidationEvent {
  type: 'entity' | 'pattern' | 'version';
  prefix: string;
  id?: string;
  timestamp: number;
}
