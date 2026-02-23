import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext, AppRequest as Request, Response, NextFunction } from '@repo/types';
import { randomUUID } from 'node:crypto';

function headerString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function getClientIp(req: Request): string | undefined {
  // If you set app.set('trust proxy', 1), req.ip will reflect x-forwarded-for
  if (req.ip) return req.ip;

  const xff = headerString(req.headers['x-forwarded-for']);
  if (xff) return xff.split(',')[0]?.trim();

  return req.socket?.remoteAddress;
}

/**
 * ContextMiddleware - Initializes AsyncLocalStorage context for every request.
 *
 * This middleware runs BEFORE any guards or interceptors. It:
 * 1. Creates the base RequestContext with request metadata
 * 2. Wraps the entire request lifecycle in AsyncLocalStorage.run()
 * 3. Makes the context available throughout the request (services, utils, etc.)
 *
 * The user context is populated later by JwtAuthGuard after authentication.
 *
 * @example
 * ```typescript
 * // In any service or utility, access context via:
 * const ctx = globalRequestContext.getStore();
 * const requestId = ctx?.requestId;
 * ```
 */
@Injectable()
export class ContextMiddleware implements NestMiddleware {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly als: AsyncLocalStorage<RequestContext>) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Extract or generate request ID for correlation
    const requestId =
      headerString(req.headers['x-request-id']) ||
      headerString(req.headers['x-correlation-id']) ||
      randomUUID();

    // Echo back for tracing
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-correlation-id', requestId);

    // Build the initial request context (user populated by auth guard later)
    const context: RequestContext = {
      requestId,
      method: req.method,
      path: req.path,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'] as string | undefined,
      startTime: Date.now(),
      // user, claims, prismaTransaction - populated later by guards/services
    };
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    if (process.env.CONTEXT_EXPOSE_RAW_REQUEST === 'true') {
      context.getRequest = () => req;
    }

    // Run the rest of the request within the AsyncLocalStorage context
    this.als.run(context, () => next());
  }
}
