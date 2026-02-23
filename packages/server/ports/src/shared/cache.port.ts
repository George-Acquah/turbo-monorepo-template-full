// libs/ports/src/cache/enhanced-cache.port.ts

import { CacheOptions, InvalidationEvent } from './shared.interface'; // Move interfaces to a common types file

export abstract class CachePort {
  // Entity Operations
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

  // List Operations
  abstract getList<T>(prefix: string, params?: Record<string, unknown>): Promise<T[] | null>;
  abstract setList<T>(
    prefix: string,
    value: T[],
    params?: Record<string, unknown>,
    options?: CacheOptions,
  ): Promise<void>;
  abstract invalidateLists(prefix: string): Promise<void>;

  // Versioning
  abstract getVersion(prefix: string): Promise<number>;
  abstract bumpVersion(prefix: string): Promise<number>;

  // Cache-Aside Patterns
  abstract getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
  abstract getOrSetEntity<T>(
    prefix: string,
    id: string,
    factory: () => Promise<T | null>,
    options?: CacheOptions,
  ): Promise<T | null>;
  abstract getOrSetList<T>(
    prefix: string,
    factory: () => Promise<T[]>,
    params?: Record<string, unknown>,
    options?: CacheOptions,
  ): Promise<T[]>;

  // Utility
  abstract generateListKey(
    prefix: string,
    params?: Record<string, unknown> | unknown,
    versioned?: boolean,
  ): Promise<string>;
  abstract generateEntityKey(
    prefix: string,
    id: string | number,
    versioned?: boolean,
  ): Promise<string>;
  abstract invalidateByPattern(pattern: string): Promise<void>;
  abstract publishInvalidation(event: InvalidationEvent): Promise<void>;
}

export const CACHE_PORT_TOKEN = Symbol('CACHE_PORT_TOKEN');
