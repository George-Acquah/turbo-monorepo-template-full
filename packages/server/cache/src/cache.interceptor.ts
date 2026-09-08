/**
 * Cache Interceptor - Implements caching logic for @Cacheable decorator
 *
 * ============================================================================
 * WHAT CHANGED AND WHY
 * ============================================================================
 *
 * 1. Fixed a live double-execution bug.
 *    The old code did:
 *      const cached = await cacheService.getOrSet(key, () => next.handle().toPromise(), ttl);
 *      if (cached !== undefined) return of(cached);
 *      return next.handle().pipe(tap(...));   // <-- ran AGAIN if `cached` was undefined
 *    Any handler that legitimately returns undefined/void (e.g. a 204
 *    endpoint) would fall through and execute the controller method a SECOND
 *    time for the same request. The rewrite has exactly one path that calls
 *    `next.handle()`, gated by CacheService.resolve()'s single-flight logic,
 *    so the handler runs at most once per request.
 *
 * 2. Pure RxJS — no stray `toPromise()`/`await` mixed into the observable
 *    chain except at the one legitimate boundary (bridging the Promise-based
 *    cache layer to the Observable-based Nest handler), done via
 *    `firstValueFrom` inside the factory CacheService.resolve() calls.
 *
 * 3. Eviction is now properly awaited as part of the response stream instead
 *    of being fire-and-forgotten inside `tap(async () => {...})`. The old
 *    code's async tap callback was never awaited by RxJS, so a client could
 *    receive a "success" response before the cache invalidation had actually
 *    completed, creating a window where a follow-up read could return stale
 *    data. Eviction failures are caught and logged without failing the
 *    request (cache problems shouldn't break the write that triggered them).
 *
 * 4. All cache-key construction is delegated to CacheService
 *    (generateEntityKey / generateListKey / computeArgsHash). The interceptor
 *    only decides *what* to key on; it no longer re-implements prefix/suffix/
 *    version assembly, which used to drift independently from the service's
 *    own key builder.
 *
 * 5. Optional cache-bypass header (default `x-cache-bypass: 1`/`true`).
 *    A bypass request skips the cache read but still writes the fresh result
 *    through, so other callers still benefit.
 */

import { LoggerPort, LOGGER_TOKEN } from '@workspace/ports';
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js';
import { Observable, from, of, firstValueFrom } from 'rxjs';
import { catchError, concatMap, map, switchMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from './cache.service';

import {
  CACHE_OPTIONS_METADATA,
  CACHE_EVICT_METADATA,
  NO_CACHE_METADATA,
  CacheableOptions,
  CacheEvictOptions,
  CacheKeyContext,
} from './cacheable.decorator';
import { ResolveOptions } from '@workspace/ports';
import { AppRequest } from '@workspace/types';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';

type RouteArgMetadata = {
  index: number;
  data?: string;
};

type RouteArgsMetadata = Record<string, RouteArgMetadata>;

export interface CacheInterceptorConfig {
  /** Header name that, when truthy ('1' or 'true'), bypasses the cache read for this request. */
  bypassHeaderName: string;
}

export const CACHE_INTERCEPTOR_CONFIG_TOKEN = Symbol('CACHE_INTERCEPTOR_CONFIG_TOKEN');

const DEFAULT_CONFIG: CacheInterceptorConfig = { bypassHeaderName: 'x-cache-bypass' };

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly context = CacheInterceptor.name;

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Optional()
    @Inject(CACHE_INTERCEPTOR_CONFIG_TOKEN)
    private readonly config: CacheInterceptorConfig = DEFAULT_CONFIG,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const noCache = this.reflector.get<boolean>(NO_CACHE_METADATA, context.getHandler());
    if (noCache) {
      return next.handle();
    }

    const evictOptions = this.reflector.get<CacheEvictOptions>(
      CACHE_EVICT_METADATA,
      context.getHandler(),
    );
    if (evictOptions) {
      return this.handleEviction(context, next, evictOptions);
    }

    const cacheOptions = this.reflector.get<CacheableOptions>(
      CACHE_OPTIONS_METADATA,
      context.getHandler(),
    );
    if (!cacheOptions) {
      return next.handle();
    }

    return this.handleCaching(context, next, cacheOptions);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Caching path
  // ─────────────────────────────────────────────────────────────────────────

  private handleCaching(
    context: ExecutionContext,
    next: CallHandler,
    options: CacheableOptions,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const args = this.buildHandlerArgs(context, request);
    const keyContext = this.buildKeyContext(request);

    if (options.condition && !options.condition(args)) {
      return next.handle();
    }

    const bypass = this.isBypassRequested(request);

    return from(this.generateCacheKey(options, args, keyContext)).pipe(
      switchMap((cacheKey) => {
        const resolveOptions: ResolveOptions = {
          ttl: options.ttl ?? 300,
          staleTtl: options.staleTtl,
          lock: options.lock,
          lockTtlSeconds: options.lockTtlSeconds,
          shouldCache: options.shouldCache,
          prefix: options.prefix,
        };

        if (bypass) {
          return next
            .handle()
            .pipe(
              switchMap((result) =>
                from(this.cacheService.writeThrough(cacheKey, result, resolveOptions)).pipe(
                  map(() => result),
                ),
              ),
            );
        }

        return from(
          this.cacheService.resolve(cacheKey, () => firstValueFrom(next.handle()), resolveOptions),
        ).pipe(
          map((entry) => {
            const status = entry.hit ? (entry.stale ? 'stale-hit' : 'hit') : 'miss';
            this.logger.debug(`Cache ${status}: ${cacheKey}`, this.context);
            return entry.value;
          }),
        );
      }),
    );
  }

  private isBypassRequested(request: AppRequest): boolean {
    const value = request.headers?.[this.config.bypassHeaderName];
    const flag = Array.isArray(value) ? value[0] : value;
    return flag === '1' || flag === 'true';
  }

  private async generateCacheKey(
    options: CacheableOptions,
    args: unknown[],
    keyContext: CacheKeyContext,
  ): Promise<string> {
    const { prefix, keyGenerator, isList, versioned = true, autoGenerateKey } = options;

    if (autoGenerateKey) {
      return this.cacheService.generateListKey(
        prefix,
        this.buildAutoKeyInput(keyContext),
        versioned,
      );
    }

    if (keyGenerator) {
      const suffix = this.normalizeKeyGeneratorResult(keyGenerator(args, keyContext));
      return isList
        ? this.cacheService.generateListKey(prefix, { key: suffix }, versioned)
        : this.cacheService.generateEntityKey(prefix, suffix, versioned);
    }

    if (isList) {
      return this.cacheService.generateListKey(
        prefix,
        this.buildAutoKeyInput(keyContext),
        versioned,
      );
    }

    // No key generator and not a list: key on a hash of the raw arguments.
    const argsHash = this.cacheService.computeArgsHash(args);
    return this.cacheService.generateEntityKey(prefix, argsHash, versioned);
  }

  private normalizeKeyGeneratorResult(result: string | string[]): string {
    return Array.isArray(result) ? result.join(':') : result;
  }

  private buildAutoKeyInput(keyContext: CacheKeyContext): Record<string, unknown> {
    return {
      method: keyContext.method,
      path: keyContext.path,
      userId: keyContext.userId,
      sessionId: keyContext.sessionId,
      params: keyContext.params ?? {},
      query: keyContext.query ?? {},
      body: keyContext.body ?? null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Eviction path
  // ─────────────────────────────────────────────────────────────────────────

  private handleEviction(
    context: ExecutionContext,
    next: CallHandler,
    options: CacheEvictOptions,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const args = this.buildHandlerArgs(context, request);
    const keyContext = this.buildKeyContext(request);

    return next.handle().pipe(
      concatMap((result) =>
        from(this.performEviction(options, args, keyContext)).pipe(
          map(() => result),
          catchError((error) => {
            this.logger.error(
              `Cache eviction failed: ${error}`,
              error instanceof Error ? error.stack : undefined,
              this.context,
            );
            // Don't fail the request because cache invalidation failed —
            // but we DID wait for it, so a follow-up read racing the response
            // is far less likely than under the old fire-and-forget version.
            return of(result);
          }),
        ),
      ),
    );
  }

  private async performEviction(
    options: CacheEvictOptions,
    args: unknown[],
    keyContext: CacheKeyContext,
  ): Promise<void> {
    if (options.keyGenerator) {
      const keyParts = options.keyGenerator(args, keyContext);
      const keys = Array.isArray(keyParts) ? keyParts : [keyParts];
      await Promise.all(keys.map((key) => this.cacheService.deleteEntity(options.prefix, key)));
    }

    if (options.invalidateLists) {
      await this.cacheService.invalidateLists(options.prefix);
    }

    if (options.patterns) {
      await Promise.all(
        options.patterns.map((pattern) => this.cacheService.invalidateByPattern(pattern)),
      );
    }

    this.logger.debug(
      `Cache evicted: prefix=${options.prefix} invalidateLists=${options.invalidateLists}`,
      this.context,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Nest argument/context extraction (unchanged mechanics from the original —
  // this part wasn't buggy, just verbose; it's Nest's own metadata contract)
  // ─────────────────────────────────────────────────────────────────────────

  private buildKeyContext(request: AppRequest): CacheKeyContext {
    const requestIdHeader = request.headers?.['x-request-id'];
    const sessionIdHeader = request.headers?.['x-session-id'];

    return {
      userId: request.user?.id,
      requestId: Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader,
      sessionId: Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader,
      path: request.path,
      method: request.method,
      params: (request.params ?? {}) as Record<string, unknown>,
      query: (request.query ?? {}) as Record<string, unknown>,
      body: request.body,
      headers: (request.headers ?? {}) as Record<string, unknown>,
      ip: request.ip,
    };
  }

  private buildHandlerArgs(context: ExecutionContext, request: AppRequest): unknown[] {
    const routeArgsMetadata = this.getRouteArgsMetadata(context);
    const metadataEntries = Object.entries(routeArgsMetadata);

    if (metadataEntries.length === 0) {
      return [];
    }

    const maxIndex = Math.max(...metadataEntries.map(([, metadata]) => metadata.index));
    const response = context.switchToHttp().getResponse<unknown>();
    const next = context.switchToHttp().getNext<unknown>();
    const args: unknown[] = Array(maxIndex + 1).fill(undefined);

    for (const [metadataKey, metadata] of metadataEntries) {
      args[metadata.index] = this.extractRouteArgValue(
        metadataKey,
        metadata.data,
        request,
        response,
        next,
      );
    }

    return args;
  }

  private getRouteArgsMetadata(context: ExecutionContext): RouteArgsMetadata {
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      context.getClass(),
      context.getHandler().name,
    ) as RouteArgsMetadata | undefined;

    return metadata ?? {};
  }

  private extractRouteArgValue(
    metadataKey: string,
    data: string | undefined,
    request: AppRequest,
    response: unknown,
    next: unknown,
  ): unknown {
    const [rawType] = metadataKey.split(':');
    const type = Number(rawType);

    if (Number.isNaN(type)) {
      return undefined;
    }

    switch (type) {
      case RouteParamtypes.REQUEST:
        return request;
      case RouteParamtypes.RESPONSE:
        return response;
      case RouteParamtypes.NEXT:
        return next;
      case RouteParamtypes.BODY:
        return data ? this.readObjectField(request.body, data) : request.body;
      case RouteParamtypes.RAW_BODY:
        return this.readObjectField(request, 'rawBody');
      case RouteParamtypes.QUERY:
        return data ? this.readObjectField(request.query, data) : request.query;
      case RouteParamtypes.PARAM:
        return data ? this.readObjectField(request.params, data) : request.params;
      case RouteParamtypes.HEADERS:
        return data ? this.readObjectField(request.headers, data.toLowerCase()) : request.headers;
      case RouteParamtypes.SESSION:
        return this.readObjectField(request, 'session');
      case RouteParamtypes.FILE:
        return this.readObjectField(request, data ?? 'file');
      case RouteParamtypes.FILES:
        return this.readObjectField(request, 'files');
      case RouteParamtypes.HOST: {
        const hosts = this.readObjectField(request, 'hosts');
        return data ? this.readObjectField(hosts, data) : hosts;
      }
      case RouteParamtypes.IP:
        return request.ip;
      default:
        return undefined;
    }
  }

  private readObjectField(source: unknown, key: string): unknown {
    if (!source || typeof source !== 'object') {
      return undefined;
    }
    return (source as Record<string, unknown>)[key];
  }
}
