// libs/ports/src/cache/cache.port.ts

import { CacheEntry, CacheOptions, InvalidationEvent, ResolveOptions } from './cache.types';

export const CACHE_PORT_TOKEN = Symbol('CACHE_PORT_TOKEN');

export abstract class CachePort {
  // ---------------------------------------------------------------------------
  // Core
  // ---------------------------------------------------------------------------

  /**
   * Retrieves a value from the cache.
   */
  abstract get<T>(key: string): Promise<T | null>;

  /**
   * Stores a value in the cache.
   */
  abstract set<T>(key: string, value: T, ttl?: number): Promise<T>;

  /**
   * Cache-aside helper with stampede protection and stale support.
   */
  abstract resolve<T>(
    key: string,
    factory: () => Promise<T>,
    options: ResolveOptions,
  ): Promise<CacheEntry<T>>;

  // ---------------------------------------------------------------------------
  // Entity Cache
  // ---------------------------------------------------------------------------

  abstract getEntity<T>(
    prefix: string,
    id: string,
    options?: { versioned?: boolean },
  ): Promise<T | null>;

  abstract setEntity<T>(
    prefix: string,
    id: string,
    value: T,
    options?: CacheOptions,
  ): Promise<void>;

  abstract deleteEntity(prefix: string, id: string): Promise<void>;

  abstract getOrSetEntity<T>(
    prefix: string,
    id: string,
    factory: () => Promise<T | null>,
    options?: Partial<ResolveOptions> & {
      versioned?: boolean;
    },
  ): Promise<T | null>;

  // ---------------------------------------------------------------------------
  // List Cache
  // ---------------------------------------------------------------------------

  abstract getList<T>(prefix: string, params?: Record<string, unknown>): Promise<T[] | null>;

  abstract setList<T>(
    prefix: string,
    value: T[],
    params?: Record<string, unknown>,
    options?: CacheOptions,
  ): Promise<void>;

  abstract invalidateLists(prefix: string): Promise<void>;

  abstract getOrSetList<T>(
    prefix: string,
    factory: () => Promise<T[]>,
    params?: Record<string, unknown>,
    options?: Partial<ResolveOptions>,
  ): Promise<T[]>;

  // ---------------------------------------------------------------------------
  // Versioning
  // ---------------------------------------------------------------------------

  abstract getVersion(prefix: string): Promise<number>;

  abstract bumpVersion(prefix: string): Promise<number>;

  // ---------------------------------------------------------------------------
  // Key Generation
  // ---------------------------------------------------------------------------

  abstract generateEntityKey(
    prefix: string,
    id: string | number,
    versioned?: boolean,
  ): Promise<string>;

  abstract generateListKey(
    prefix: string,
    params?: Record<string, unknown> | unknown,
    versioned?: boolean,
  ): Promise<string>;

  // ---------------------------------------------------------------------------
  // Invalidation
  // ---------------------------------------------------------------------------

  abstract invalidateByPattern(pattern: string): Promise<void>;

  abstract publishInvalidation(event: InvalidationEvent): Promise<void>;
}

/**
 * Optional observability hooks.
 *
 * Register an implementation under `CACHE_METRICS_TOKEN`
 * to collect cache hit/miss/stale/error/lock-wait metrics.
 */
export abstract class CacheMetricsPort {
  abstract onHit?(
    key: string,
    meta: {
      prefix: string;
      stale: boolean;
    },
  ): void;

  abstract onMiss?(
    key: string,
    meta: {
      prefix: string;
    },
  ): void;

  abstract onError?(key: string, error: unknown): void;

  abstract onLockWait?(key: string, waitedMs: number): void;
}

export const CACHE_METRICS_TOKEN = Symbol('CACHE_METRICS_TOKEN');
