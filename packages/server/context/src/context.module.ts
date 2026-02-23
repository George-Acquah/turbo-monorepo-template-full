import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { Global } from '@nestjs/common/decorators/modules/global.decorator';
import { AsyncContextService } from './context.service';
import { ContextMiddleware } from './middleware/context.middleware';
import { RequestContext } from '@repo/types';
import { CONTEXT_TOKEN } from '@repo/ports';

// Export a single shared AsyncLocalStorage instance so non-DI code can access
// the current request context (e.g., utility functions that need companyId).
export const globalRequestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Test / helper utility to run a function with a fake request context. This
 * is handy in unit tests where you want to simulate a request store.
 */
export function runWithRequestContext<T>(ctx: RequestContext, cb: () => T): T {
  return globalRequestContext.run(ctx, cb);
}

/**
 * Get the current request context from outside NestJS DI.
 * Returns undefined if called outside a request scope.
 *
 * @example
 * ```typescript
 * import { getRequestContext } from '@repo/context';
 *
 * function someUtility() {
 *   const ctx = getRequestContext();
 *   const requestId = ctx?.requestId;
 * }
 * ```
 */
export function getRequestContext(): RequestContext | undefined {
  return globalRequestContext.getStore();
}

/**
 * Get the current user from request context (non-DI access).
 * Returns undefined if not authenticated or outside request scope.
 */
export function getCurrentUser() {
  return getRequestContext()?.user;
}

/**
 * Get the current request ID from context (non-DI access).
 * Returns 'unknown' if outside request scope.
 */
export function getRequestId(): string {
  return getRequestContext()?.requestId ?? 'unknown';
}

@Global()
@Module({
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: globalRequestContext,
    },
    AsyncContextService,
    {
      provide: CONTEXT_TOKEN,
      useExisting: AsyncContextService,
    },
    ContextMiddleware,
  ],
  // Only export Nest providers (tokens/classes). The raw variable is exported
  // via the module file's ES export above and should NOT appear here.
  exports: [CONTEXT_TOKEN, AsyncLocalStorage, AsyncContextService, ContextMiddleware],
})
export class AppContextModule implements NestModule {
  /**
   * Apply the ContextMiddleware to all routes.
   * This ensures every request has a context before guards/interceptors run.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleware).forRoutes('*path');
  }
}
