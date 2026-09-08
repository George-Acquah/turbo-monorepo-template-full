/**
 * Cacheable Decorator - Method-level caching with key prefix support
 *
 * Uses key prefixes from @workspace/constants for consistent cache key generation.
 *
 * CHANGES vs previous version:
 * - Added `staleTtl`, `lock`, `lockTtlSeconds`, `shouldCache` to CacheableOptions.
 *   These map directly onto CacheService's ResolveOptions and are consumed by
 *   the rewritten CacheInterceptor. All are optional — existing usages of
 *   @Cacheable keep working unchanged.
 * - No changes to CacheEvict / NoCache — their contract was already sound.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class ProductService {
 *   @Cacheable({
 *     prefix: RedisKeyPrefixes.ENTITY.PRODUCT,
 *     ttl: CacheTTL.PRODUCT,
 *     staleTtl: 30,        // serve stale for up to 30s while refreshing in the background
 *     lock: true,          // avoid a stampede when the entry expires under load
 *     keyGenerator: (args) => args[0],
 *   })
 *   async getProduct(id: string): Promise<Product> {
 *     return this.repository.findById(id);
 *   }
 * }
 * ```
 */

import { SetMetadata } from '@nestjs/common';
import { CacheTTL } from '@workspace/constants';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const CACHE_OPTIONS_METADATA = 'cache:options';

/**
 * Key generator function type
 * @param args - Resolved controller method arguments
 * @param context - Optional context (user, request, etc.)
 */
export type CacheKeyGenerator = (args: unknown[], context?: CacheKeyContext) => string | string[];

export interface CacheKeyContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  path?: string;
  method?: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, unknown>;
  ip?: string;
}

export interface CacheableOptions {
  /** Key prefix from RedisKeyPrefixes constant */
  prefix: string;
  /** Fresh TTL in seconds (default: CacheTTL.EPHEMERAL) */
  ttl?: number;
  /** Custom key generator function */
  keyGenerator?: CacheKeyGenerator;
  /** If true, cache key will be versioned for invalidation (default: true) */
  versioned?: boolean;
  /** If true, this is a list query (uses list versioning) */
  isList?: boolean;
  /** If true, use CacheService auto-generation for keys (preferred for lists) */
  autoGenerateKey?: boolean;
  /** Condition function - if returns false, caching is skipped entirely for this call */
  condition?: (args: unknown[]) => boolean;
  /**
   * Extra seconds beyond `ttl` during which a stale value may be served while
   * a background refresh runs. Omit to disable stale-while-revalidate.
   */
  staleTtl?: number;
  /**
   * Enable stampede protection (a short Redis lock) so only one process
   * recomputes a cold/expired key at a time.
   */
  lock?: boolean;
  /** TTL for the stampede lock itself, in seconds. Defaults to 10. */
  lockTtlSeconds?: number;
  /** Predicate deciding whether a freshly computed value should be cached. */
  shouldCache?: (value: unknown) => boolean;
}

/**
 * Cacheable decorator for method-level caching
 *
 * Note: This decorator sets metadata. You need a CacheInterceptor
 * to actually implement the caching logic.
 */
export function Cacheable(options: CacheableOptions): MethodDecorator {
  const {
    prefix,
    ttl = CacheTTL.EPHEMERAL,
    keyGenerator,
    versioned = true,
    isList = false,
    autoGenerateKey = false,
    condition,
    staleTtl,
    lock,
    lockTtlSeconds,
    shouldCache,
  } = options;

  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_OPTIONS_METADATA, {
      prefix,
      ttl,
      keyGenerator,
      versioned,
      isList,
      autoGenerateKey,
      condition,
      staleTtl,
      lock,
      lockTtlSeconds,
      shouldCache,
    })(target, propertyKey, descriptor);

    return descriptor;
  };
}

/**
 * CacheEvict decorator - Marks method as cache-invalidating
 *
 * @example
 * ```typescript
 * @CacheEvict({
 *   prefix: RedisKeyPrefixes.ENTITY.PRODUCT,
 *   keyGenerator: (args) => args[0], // Product ID
 *   invalidateLists: true,
 * })
 * async updateProduct(id: string, data: UpdateDto): Promise<Product> { ... }
 * ```
 */
export const CACHE_EVICT_METADATA = 'cache:evict';

export interface CacheEvictOptions {
  /** Key prefix to evict */
  prefix: string;
  /** Key generator for specific entity eviction */
  keyGenerator?: CacheKeyGenerator;
  /** If true, also bump the list version */
  invalidateLists?: boolean;
  /** Additional patterns to evict */
  patterns?: string[];
}

export function CacheEvict(options: CacheEvictOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_EVICT_METADATA, options)(target, propertyKey, descriptor);
    return descriptor;
  };
}

/**
 * NoCaching decorator - Explicitly disable caching for a method
 */
export const NO_CACHE_METADATA = 'cache:disabled';

export function NoCache(): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata(NO_CACHE_METADATA, true)(target, propertyKey, descriptor);
    return descriptor;
  };
}
