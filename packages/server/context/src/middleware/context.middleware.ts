import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

import { RequestContext, AppRequest as Request, Response, NextFunction } from '@workspace/types';
import { randomUUID } from 'node:crypto';
import { APP_RUNTIME_CONFIG_TOKEN, type AppRuntimeConfig, CONTEXT_RUNTIME_CONFIG_TOKEN, type ContextRuntimeConfig } from '@workspace/ports/config';

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
  constructor(
    private readonly als: AsyncLocalStorage<RequestContext>,
    @Inject(CONTEXT_RUNTIME_CONFIG_TOKEN)
    private readonly config: ContextRuntimeConfig,
     @Inject(APP_RUNTIME_CONFIG_TOKEN)
    private readonly runtimeConfig: AppRuntimeConfig,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Extract or generate request ID for correlation
    const requestId =
      headerString(req.headers['x-request-id']) ||
      headerString(req.headers['x-correlation-id']) ||
      randomUUID();

    // Echo back for tracing
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-correlation-id', requestId);

    // Security headers (set conservatively only in production).
    // We set these at origin as a fallback; Cloudflare edge should ideally enforce them.
    if (this.runtimeConfig.nodeEnv === 'production') {
      // HSTS — only when served over TLS (production behind Cloudflare)
      try {
        res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
      } catch {
        // ignore header set errors
      }

      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      // Opt-out of interest-cohort (FLoC) and disable device features by default
      res.setHeader(
        'Permissions-Policy',
        'geolocation=(), camera=(), microphone=(), interest-cohort=()',
      );

      // This app is almost entirely JSON — default-src 'none' is safe for
      // every route except Swagger's self-hosted HTML/JS/CSS UI, which needs
      // same-origin script/style (and 'unsafe-inline' — swagger-ui-dist
      // injects inline styles/scripts; a stricter CSP breaks its rendering).
      // SwaggerModule.setup() mounts bare at /docs*, NOT under the /api
      // global prefix (same reason ORIGIN_AUTH_EXEMPT_GET_PATHS in
      // origin-auth.middleware.ts lists bare '/docs'/'/docs-json'/'/docs-yaml'
      // rather than '/api/docs*') — matching on '/api/docs' here never
      // actually matched the real route.
      const isDocsRoute = req.path.startsWith('/docs');
      // form-action doesn't fall back to default-src per the CSP spec, so it
      // must be listed explicitly even when default-src is 'none' — ZAP's
      // "CSP: Failure to Define Directive with No Fallback" finding.
      res.setHeader(
        'Content-Security-Policy',
        isDocsRoute
          ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
          : "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; connect-src 'self'; form-action 'none'",
      );
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

      // Remove server header to avoid leaking origin technology
      try {
        res.removeHeader('Server');
      } catch {
        // ignore if not supported
      }
    }

    const context: RequestContext = {
      requestId,
      method: req.method,
      path: req.path,
      ip: getClientIp(req),
      userAgent: headerString(req.headers['user-agent']),
      deviceId: headerString(req.headers['x-device-id']),
      sessionId: headerString(req.headers['x-session-id']),
      trace: {
        requestId,
        correlationId: requestId,
        sessionId: headerString(req.headers['x-session-id']),
      },
      startTime: Date.now(),
      // user, claims, transactions - populated later by guards/services
    };
    if (this.config.exposeRawRequest) {
      context.getRequest = () => req;
    }

    // Run the rest of the request within the AsyncLocalStorage context.
    this.als.run(context, () => {
      next();
    });
  }
}
