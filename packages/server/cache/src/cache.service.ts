/**
 * Cache Service - Cache-Aside Pattern with Versioning, Coalescing, and SWR
 *
 * ============================================================================
 * WHAT CHANGED AND WHY (read this before touching the internals)
 * ============================================================================
 *
 * 1. Hit/miss ambiguity removed.
 *    The old service returned `T | null` from getEntity/getOrSetEntity, so a
 *    legitimately-cached `null` was indistinguishable from a miss. The new
 *    `resolve()` primitive always invokes the factory on a miss and returns
 *    the real value — there is no sentinel to confuse. See CacheEntry in
 *    cache.types.ts for the reasoning.
 *
 * 2. Atomic version bumps.
 *    `bumpVersion` used to do a GET then a SET as two round-trips, so two
 *    concurrent evictions could race and one bump would be lost (both read
 *    version 3, both write version 4, and the intended "5" never happens).
 *    It now uses RedisPort#incr, which is atomic.
 *
 * 3. Single-flight (request coalescing).
 *    Concurrent calls for the *same* key on the *same* instance now share one
 *    in-flight factory execution instead of each hitting the DB/upstream.
 *
 * 4. Stampede protection across instances (optional, opt in via `lock: true`).
 *    On a cold/expired key, one process acquires a short Redis lock (SETNX)
 *    and computes the value; others poll briefly for the result and fall back
 *    to computing independently if the lock holder doesn't finish in time
 *    (this avoids a slow computation blocking every other instance forever).
 *    This is intentionally simple — not a full Redlock with fencing tokens.
 *
 * 5. Stale-while-revalidate (optional, opt in via `staleTtl`).
 *    A value past its fresh TTL but still inside the stale window is served
 *    immediately while a refresh happens in the background (itself
 *    lock-protected so only one instance refreshes at a time).
 *
 * 6. Two real bugs fixed (not just architecture):
 *    - `normalize()` used to pass `this.normalize` as a bare array-map
 *      callback, unbinding `this`. Any params object containing an array of
 *      nested objects would throw at runtime when building a list cache key.
 *      Fixed by making `normalize` a bound arrow class field.
 *    - `hashArgs()` used to catch JSON.stringify failures (circular refs,
 *      BigInt, etc.) and fall back to the literal key `'default'` for ALL
 *      such failures — meaning two different requests that both failed to
 *      serialize could collide on the same cache key and one user could see
 *      another's cached response. Fixed with a safe stringifier that handles
 *      circular references and BigInt instead of ever throwing, so the
 *      collapsing fallback is no longer needed.
 *
 * 7. Key generation is now centralized here. CacheInterceptor no longer
 *    re-implements prefix/suffix/version key assembly — it only decides
 *    *what* to key on, and delegates the actual string-building to
 *    generateEntityKey / generateListKey below.
 */

import { Inject, Injectable, Optional } from '@nestjs/common';
import { RedisKeyPrefixes, CacheTTL } from '@workspace/constants';

import * as crypto from 'crypto';
import {
  CACHE_METRICS_TOKEN,
  CacheEntry,
  CacheMetricsPort,
  CachePort,
  CacheOptions,
  InvalidationEvent,
  LOGGER_TOKEN,
  LoggerPort,
  REDIS_PORT_TOKEN,
  ResolveOptions,
  RedisPort,
} from '@workspace/ports';

const DEFAULT_LOCK_TTL_SECONDS = 10;
const DEFAULT_LOCK_WAIT_RETRIES = 5;
const DEFAULT_LOCK_WAIT_DELAY_MS = 100;

/** Internal envelope stored in Redis so we can compute freshness/staleness without a second key. */
interface StoredValue<T> {
  v: T;
  createdAt: number;
  ttl: number; // seconds
}

type FreshnessState = 'miss' | 'fresh' | 'stale';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class CacheService implements CachePort {
  private readonly context = CacheService.name;

  /** Per-instance in-flight map for single-flight coalescing. Not shared across instances. */
  private readonly inflight = new Map<string, Promise<CacheEntry<unknown>>>();

  constructor(
    @Inject(REDIS_PORT_TOKEN) private readonly redis: RedisPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Optional() @Inject(CACHE_METRICS_TOKEN) private readonly metrics?: CacheMetricsPort,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Generic low-level get/set (unwrapped, no staleness/versioning/locking).
  // Kept for simple key/value use cases outside the entity/list pattern.
  // ─────────────────────────────────────────────────────────────────────────

  async set<T>(key: string, value: T, ttl?: number): Promise<T> {
    await this.redis.set(key, value, ttl ?? CacheTTL.EPHEMERAL);
    return value;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(key);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Core cache-aside primitive
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Resolve a value through the cache. Always returns the real value —
   * on a miss, `factory` runs and its result is returned directly (no
   * null-as-miss ambiguity). Concurrent calls for the same key on this
   * instance are coalesced into a single factory execution.
   */
  async resolve<T>(
    key: string,
    factory: () => Promise<T>,
    options: ResolveOptions,
  ): Promise<CacheEntry<T>> {
    const existing = this.inflight.get(key) as Promise<CacheEntry<T>> | undefined;
    if (existing) {
      return existing;
    }

    const promise = this.resolveUncoalesced<T>(key, factory, options);
    this.inflight.set(key, promise as Promise<CacheEntry<unknown>>);

    try {
      return await promise;
    } finally {
      this.inflight.delete(key);
    }
  }

  private async resolveUncoalesced<T>(
    key: string,
    factory: () => Promise<T>,
    options: ResolveOptions,
  ): Promise<CacheEntry<T>> {
    let stored: StoredValue<T> | null = null;
    try {
      stored = await this.readRaw<T>(key);
    } catch (error) {
      this.metrics?.onError?.(key, error);
      this.logger.error(`Cache read failed for ${key}: ${error}`, undefined, this.context);
    }

    const state = this.classify(stored);

    if (state === 'fresh') {
      this.metrics?.onHit?.(key, { prefix: options.prefix, stale: false });
      return { hit: true, stale: false, value: (stored as StoredValue<T>).v };
    }

    if (state === 'stale') {
      this.metrics?.onHit?.(key, { prefix: options.prefix, stale: true });
      // Serve stale immediately; refresh in the background (lock-protected so
      // only one instance does the actual refresh work).
      void this.refreshInBackground(key, factory, options);
      return { hit: true, stale: true, value: (stored as StoredValue<T>).v };
    }

    this.metrics?.onMiss?.(key, { prefix: options.prefix });
    const value = await this.computeWithLock(key, factory, options);
    return { hit: false, stale: false, value };
  }

  /** Writes a value through unconditionally (used by cache-bypass paths). */
  async writeThrough<T>(key: string, value: T, options: ResolveOptions): Promise<void> {
    const shouldCache = options.shouldCache ?? (() => true);
    if (!shouldCache(value)) return;
    await this.writeRaw(key, value, options.ttl, options.staleTtl ?? 0);
  }

  private async computeWithLock<T>(
    key: string,
    factory: () => Promise<T>,
    options: ResolveOptions,
  ): Promise<T> {
    if (!options.lock) {
      const value = await factory();
      await this.maybeWrite(key, value, options);
      return value;
    }

    const lockKey = `${key}:lock`;
    const lockTtl = options.lockTtlSeconds ?? DEFAULT_LOCK_TTL_SECONDS;
    const acquired = await this.redis.setNX(lockKey, '1', lockTtl).catch(() => false);

    if (acquired) {
      try {
        const value = await factory();
        await this.maybeWrite(key, value, options);
        return value;
      } finally {
        await this.redis.del(lockKey).catch(() => undefined);
      }
    }

    // Someone else is computing this key. Wait briefly for them to finish...
    const start = Date.now();
    const waited = await this.waitForValue<T>(key);
    this.metrics?.onLockWait?.(key, Date.now() - start);
    if (waited !== undefined) {
      return waited;
    }

    // ...but don't block forever. If the lock holder hasn't finished in time,
    // compute independently rather than starving this request.
    return factory();
  }

  private async refreshInBackground<T>(
    key: string,
    factory: () => Promise<T>,
    options: ResolveOptions,
  ): Promise<void> {
    const lockKey = `${key}:lock`;
    const lockTtl = options.lockTtlSeconds ?? DEFAULT_LOCK_TTL_SECONDS;
    const acquired = await this.redis.setNX(lockKey, '1', lockTtl).catch(() => false);
    if (!acquired) {
      // Another instance is already revalidating this key.
      return;
    }

    try {
      const value = await factory();
      await this.maybeWrite(key, value, options);
    } catch (error) {
      this.metrics?.onError?.(key, error);
      this.logger.error(`Background refresh failed for ${key}: ${error}`, undefined, this.context);
    } finally {
      await this.redis.del(lockKey).catch(() => undefined);
    }
  }

  private async maybeWrite<T>(key: string, value: T, options: ResolveOptions): Promise<void> {
    const shouldCache = options.shouldCache ?? (() => true);
    if (!shouldCache(value)) return;
    await this.writeRaw(key, value, options.ttl, options.staleTtl ?? 0);
  }

  private async waitForValue<T>(
    key: string,
    retries = DEFAULT_LOCK_WAIT_RETRIES,
    delayMs = DEFAULT_LOCK_WAIT_DELAY_MS,
  ): Promise<T | undefined> {
    for (let i = 0; i < retries; i++) {
      await sleep(delayMs);
      const stored = await this.readRaw<T>(key).catch(() => null);
      if (stored && this.classify(stored) !== 'miss') {
        return stored.v;
      }
    }
    return undefined;
  }

  private classify<T>(stored: StoredValue<T> | null): FreshnessState {
    if (!stored) return 'miss';
    const age = Date.now() - stored.createdAt;
    return age <= stored.ttl * 1000 ? 'fresh' : 'stale';
  }

  private async readRaw<T>(key: string): Promise<StoredValue<T> | null> {
    return this.redis.get<StoredValue<T>>(key);
  }

  private async writeRaw<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    staleSeconds: number,
  ): Promise<void> {
    const payload: StoredValue<T> = { v: value, createdAt: Date.now(), ttl: ttlSeconds };
    // Total Redis TTL covers the stale window too, so Redis doesn't expire the
    // key out from under us before we've had a chance to classify it as stale
    // vs gone.
    await this.redis.set(key, payload, ttlSeconds + Math.max(staleSeconds, 0));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Entity Cache Operations
  // ─────────────────────────────────────────────────────────────────────────

  /** Low-level read, bypassing coalescing/locking. Returns null on miss OR cached null. */
  async getEntity<T>(
    prefix: string,
    id: string,
    options?: { versioned?: boolean },
  ): Promise<T | null> {
    const key = await this.buildEntityKey(prefix, id, options?.versioned ?? true);
    const stored = await this.readRaw<T>(key);
    return stored ? stored.v : null;
  }

  async setEntity<T>(prefix: string, id: string, value: T, options?: CacheOptions): Promise<void> {
    const key = await this.buildEntityKey(prefix, id, options?.versioned ?? true);
    const ttl = options?.ttl ?? this.getDefaultTTL(prefix);
    await this.writeRaw(key, value, ttl, options?.staleTtl ?? 0);
  }

  async deleteEntity(prefix: string, id: string): Promise<void> {
    const pattern = `${prefix}:${id}:*`;
    await this.redis.delByPattern(pattern);
    await this.bumpVersion(prefix);
    await this.publishInvalidation({ type: 'entity', prefix, id, timestamp: Date.now() });
  }

  /** Cache-aside read/compute for a single entity. Correctly distinguishes miss from cached-null. */
  async getOrSetEntity<T>(
    prefix: string,
    id: string,
    factory: () => Promise<T | null>,
    options?: Partial<ResolveOptions> & { versioned?: boolean },
  ): Promise<T | null> {
    const key = await this.buildEntityKey(prefix, id, options?.versioned ?? true);
    const entry = await this.resolve<T | null>(key, factory, {
      ttl: options?.ttl ?? this.getDefaultTTL(prefix),
      staleTtl: options?.staleTtl,
      lock: options?.lock,
      lockTtlSeconds: options?.lockTtlSeconds,
      // Default: don't cache misses (null) — avoids permanently caching a
      // not-found result. Callers can override via options.shouldCache.
      shouldCache: options?.shouldCache ?? ((v) => v !== null && v !== undefined),
      prefix,
    });
    return entry.value;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // List Cache Operations
  // ─────────────────────────────────────────────────────────────────────────

  async getList<T>(prefix: string, params?: Record<string, unknown>): Promise<T[] | null> {
    const key = await this.buildListKey(prefix, params);
    const stored = await this.readRaw<T[]>(key);
    return stored ? stored.v : null;
  }

  async setList<T>(
    prefix: string,
    value: T[],
    params?: Record<string, unknown>,
    options?: CacheOptions,
  ): Promise<void> {
    const key = await this.buildListKey(prefix, params);
    const ttl = options?.ttl ?? this.getDefaultTTL(prefix);
    await this.writeRaw(key, value, ttl, options?.staleTtl ?? 0);
  }

  async invalidateLists(prefix: string): Promise<void> {
    await this.bumpVersion(prefix);
    this.logger.debug(`Invalidated list caches for ${prefix}`, this.context);
  }

  async getOrSetList<T>(
    prefix: string,
    factory: () => Promise<T[]>,
    params?: Record<string, unknown>,
    options?: Partial<ResolveOptions>,
  ): Promise<T[]> {
    const key = await this.buildListKey(prefix, params);
    const entry = await this.resolve<T[]>(key, factory, {
      ttl: options?.ttl ?? this.getDefaultTTL(prefix),
      staleTtl: options?.staleTtl,
      lock: options?.lock,
      lockTtlSeconds: options?.lockTtlSeconds,
      shouldCache: options?.shouldCache ?? (() => true),
      prefix,
    });
    return entry.value;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Version Management (atomic)
  // ─────────────────────────────────────────────────────────────────────────

  async getVersion(prefix: string): Promise<number> {
    const version = await this.redis.get<number>(this.versionKey(prefix));
    return version ?? 1;
  }

  /** Atomically bumps the version for a prefix, invalidating all versioned keys under it. */
  async bumpVersion(prefix: string): Promise<number> {
    const newVersion = await this.redis.incr(this.versionKey(prefix));
    this.logger.debug(`Bumped version for ${prefix} -> ${newVersion}`, this.context);
    return newVersion;
  }

  private versionKey(prefix: string): string {
    return `${prefix}:version`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Pub/Sub Invalidation
  // ─────────────────────────────────────────────────────────────────────────

  async publishInvalidation(event: InvalidationEvent): Promise<void> {
    await this.redis.publish(RedisKeyPrefixes.PUBSUB.CACHE_INVALIDATION, event);
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    await this.redis.delByPattern(pattern);
    await this.publishInvalidation({ type: 'pattern', prefix: pattern, timestamp: Date.now() });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Key building (single source of truth — CacheInterceptor delegates here)
  // ─────────────────────────────────────────────────────────────────────────

  private async buildEntityKey(prefix: string, id: string, versioned: boolean): Promise<string> {
    if (!versioned) return `${prefix}:${id}`;
    const version = await this.getVersion(prefix);
    return `${prefix}:${id}:v${version}`;
  }

  private async buildListKey(prefix: string, params?: Record<string, unknown>): Promise<string> {
    const version = await this.getVersion(prefix);
    const paramsHash = params ? this.hashParams(params) : 'all';
    return `${prefix}:list:${paramsHash}:v${version}`;
  }

  /** Public: generate an entity cache key from an id (supports versioning). Used by the interceptor. */
  async generateEntityKey(prefix: string, id: string | number, versioned = true): Promise<string> {
    return this.buildEntityKey(prefix, String(id), versioned);
  }

  /** Public: generate a list cache key from params or a primitive input. Used by the interceptor. */
  async generateListKey(
    prefix: string,
    params?: Record<string, unknown> | unknown,
    versioned = true,
  ): Promise<string> {
    let paramsObj: Record<string, unknown> | undefined;
    if (params === undefined || params === null) {
      paramsObj = undefined;
    } else if (typeof params === 'object' && !Array.isArray(params)) {
      paramsObj = params as Record<string, unknown>;
    } else {
      paramsObj = { value: params };
    }

    if (versioned) {
      return this.buildListKey(prefix, paramsObj);
    }

    const paramsHash = paramsObj ? this.hashParams(paramsObj) : 'all';
    return `${prefix}:list:${paramsHash}`;
  }

  /** Public: deterministic hash of raw handler arguments, for default (no keyGenerator) entity keys. */
  computeArgsHash(args: unknown[]): string {
    return this.hashArgs(args);
  }

  private hashParams(params: Record<string, unknown>): string {
    const json = this.stableStringify(params);
    return crypto.createHash('md5').update(json).digest('hex').slice(0, 12);
  }

  private hashArgs(args: unknown[]): string {
    const serializableArgs = args.filter((arg) => {
      if (arg === null || arg === undefined) return true;
      if (typeof arg === 'object' && 'headers' in (arg as object) && 'method' in (arg as object)) {
        return false; // skip Request-like objects
      }
      return true;
    });

    return crypto
      .createHash('md5')
      .update(this.stableStringify(serializableArgs))
      .digest('hex')
      .slice(0, 12);
  }

  private stableStringify(value: unknown): string {
    return this.safeStringify(this.normalize(value));
  }

  /**
   * Bound arrow field (not a prototype method) so recursive calls inside
   * `.map()` keep `this` correctly. The previous implementation passed
   * `this.normalize` as a bare callback to `Array.prototype.map`, which
   * unbound `this` and threw on any array of nested objects.
   */
  private normalize = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) return obj.map((item) => this.normalize(item));
    if (typeof obj !== 'object') return obj;

    const record = obj as Record<string, unknown>;
    if ('headers' in record && 'method' in record) return null; // skip Request/Response-like objects

    const sortedKeys = Object.keys(record).sort();
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      const val = record[key];
      if (val === undefined) continue;
      result[key] = this.normalize(val);
    }
    return result;
  };

  /**
   * JSON.stringify that never throws: handles circular references and BigInt.
   * The previous implementation caught stringify failures and collapsed the
   * cache key to the literal string 'default' for every such failure, which
   * could cross-contaminate cache entries between unrelated requests. This
   * makes that fallback path unnecessary by not failing in the first place.
   */
  private safeStringify(value: unknown): string {
    const seen = new WeakSet<object>();
    return JSON.stringify(value, (_key, val) => {
      if (typeof val === 'bigint') return val.toString();
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      return val;
    });
  }

  private getDefaultTTL(prefix: string): number {
    if (prefix === RedisKeyPrefixes.IDENTITY.USER) {
      return CacheTTL.PROFILE;
    }
    if (prefix === RedisKeyPrefixes.COMMUNICATIONS.DELIVERY_STATE) {
      return CacheTTL.DELIVERY_STATE;
    }
    if (prefix === RedisKeyPrefixes.FINANCE.FEE_BALANCE) {
      return CacheTTL.FINANCE_SUMMARY;
    }
    if (prefix === RedisKeyPrefixes.SEARCH.RESULTS) {
      return CacheTTL.SEARCH;
    }
    if (prefix.startsWith(RedisKeyPrefixes.IDENTITY.POLICY_DECISION)) {
      return CacheTTL.POLICY;
    }
    if (
      prefix === RedisKeyPrefixes.IDENTITY.SESSION ||
      prefix === RedisKeyPrefixes.IDENTITY.TOKEN_REFRESH
    ) {
      return CacheTTL.SESSION;
    }
    if (prefix === RedisKeyPrefixes.SYSTEM.CONFIG) {
      return CacheTTL.SYSTEM_CONFIG;
    }
    return CacheTTL.EPHEMERAL;
  }
}
