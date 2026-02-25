// src/common/context/async-context.service.ts
import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { RequestContext, UserContext, ContextAuthData, AppRequest } from '@repo/types';
import { ContextPort, TransactionEngine } from '@repo/ports';

/**
 * AsyncContextService - Primary service for accessing request context via DI.
 *
 * Use this service when you need to access the current request context
 * in a NestJS-managed class (services, guards, interceptors, etc.).
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly context: AsyncContextService) {}
 *
 *   doWork() {
 *     const user = this.context.getUser();
 *     const requestId = this.context.getRequestId();
 *   }
 * }
 * ```
 */
@Injectable()
export class AsyncContextService implements ContextPort {
  constructor(private readonly als: AsyncLocalStorage<RequestContext>) {}

  getRequest(): AppRequest | undefined {
    // return this.getStore()?.getRequest?.();
    return undefined;
  }

  /**
   * Run a callback within a new context scope.
   * Useful for testing or creating isolated context boundaries.
   */
  run<T>(context: RequestContext, callback: () => T): T {
    return this.als.run(context, callback);
  }

  /**
   * Get a specific value from the current request context.
   */
  get<T extends keyof RequestContext>(key: T): RequestContext[T] | undefined {
    return this.getStore()?.[key];
  }

  /**
   * Set a value in the current request context.
   * Returns false if no store exists (outside of request scope).
   */
  set<T extends keyof RequestContext>(key: T, value: RequestContext[T]): boolean {
    const store = this.getStore();
    if (store) {
      store[key] = value;
      return true;
    }
    return false;
  }

  /**
   * Get the entire request context store.
   */
  getStore(): RequestContext | undefined {
    return this.als.getStore();
  }

  // ─── Convenience Getters ───────────────────────────────────────

  /**
   * Get the current authenticated user context.
   */
  getUser(): UserContext | undefined {
    return this.get('user');
  }

  /**
   * Get the current user's ID. Throws if not authenticated.
   */
  getUserId(): string {
    const user = this.getUser();
    if (!user?.id) {
      throw new Error('No authenticated user in context');
    }
    return user.id;
  }

  /**
   * Get the current user's ID, or undefined if not authenticated.
   */
  getUserIdOptional(): string | undefined {
    return this.getUser()?.id;
  }

  /**
   * Get the unique request ID for correlation/tracing.
   */
  getRequestId(): string {
    return this.get('requestId') || 'unknown';
  }

  /**
   * Get Authentication metadata from the authenticated token.
   */
  getAuthMetadata(): ContextAuthData | undefined {
    return this.get('authMetadata');
  }

  /**
   * Get the device ID header value.
   */
  getDeviceId(): string | undefined {
    return this.get('deviceId');
  }

  /**
   * Get the client IP address.
   */
  getIp(): string | undefined {
    return this.get('ip');
  }

  /**
   * Get the unique request ID for correlation/tracing.
   */
  getUserAgent(): string {
    return this.get('userAgent') || 'unknown';
  }

  getRoutePath(): string | undefined {
    return this.get('path');
  }

  getMethod(): string | undefined {
    return this.get('method');
  }

  /**
   * Calculate request duration in milliseconds.
   */
  getRequestDuration(): number {
    const startTime = this.get('startTime');
    return startTime ? Date.now() - startTime : 0;
  }

  /**
   * Check if we're within a request context.
   */
  isInContext(): boolean {
    return this.getStore() !== undefined;
  }

  // ─── Context Modifiers ───────────────────────────────────────

  /**
   * Set the authenticated user context.
   * Called by auth guards after successful authentication.
   */
  setUser(user: UserContext): boolean {
    return this.set('user', user);
  }

  /**
   * Set JWT claims from the token.
   * Called by auth guards after token validation.
   */
  setAuthMetadata(authMeta: ContextAuthData): boolean {
    return this.set('authMetadata', authMeta);
  }

  /**
   * Set the authenticated user context.
   * Called by auth guards after successful authentication.
   */
  setRawRefreshToken(rawRefreshToken: string): boolean {
    return this.set('rawRefreshToken', rawRefreshToken);
  }

  setTransaction(engine: TransactionEngine, tx: unknown): boolean {
    const store = this.getStore();
    if (!store) return false;

    store.transactions ??= {};
    store.transactions[engine] = tx;
    return true;
  }

  getTransaction<T = unknown>(engine: TransactionEngine): T | undefined {
    const tx = this.get('transactions')?.[engine];
    return tx as T | undefined;
  }

  clearTransaction(engine: TransactionEngine): boolean {
    const store = this.getStore();
    if (!store?.transactions) return false;

    delete store.transactions[engine];
    return true;
  }
}
