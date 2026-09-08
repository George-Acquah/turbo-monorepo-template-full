import {
  Inject,
  Injectable,
  NestMiddleware,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  APP_RUNTIME_CONFIG_TOKEN,
  type AppRuntimeConfig,
  CORS_RUNTIME_CONFIG_TOKEN,
  type CorsRuntimeConfig,
} from '@workspace/ports/config';
import { LOGGER_TOKEN, LoggerPort, TOKEN_PORT_TOKEN, TokenPort } from '@workspace/ports';
import { HttpHeaders } from '@workspace/constants';
import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'node:crypto';

// Matches JwtAccessStrategy's extractor list (packages/server/auth/core/src/strategies/jwt.strategy.ts)
// exactly, so "does this request already carry a real session" is answered the same way here as it
// is by the actual guard.
const ACCESS_TOKEN_COOKIE = 'app_access_token';

// Real, exact incoming request paths (as the client sends them — NOT run through
// Nest's global-prefix bookkeeping) that must always bypass origin-auth: infra
// probes (Railway health checks, Prometheus/Grafana Agent scraping), the bare
// `/robots.txt` crawler route (explicitly excluded from the `api` prefix in
// app.setup.ts's `setGlobalPrefix`), and Swagger's own routes (bare, unprefixed
// — SwaggerModule.setup() doesn't set `useGlobalPrefix: true`; gated separately
// by ENABLE_SWAGGER, so once an operator turns that on it shouldn't ALSO
// require a header a plain browser GET can't send).
//
// Deliberately checked here instead of via `MiddlewareConsumer.exclude()` in
// app.module.ts: that API's path matching runs every entry through
// `RouteInfoPathExtractor`, which unconditionally prepends the global prefix
// unless the specific route was itself passed to `app.setGlobalPrefix()`'s
// `exclude` option (only `robots.txt` is, here) — confirmed directly in
// @nestjs/core@11's source (middleware/route-info-path-extractor.js), not
// assumed. That silently turns `{ path: 'api/health' }` into excluded-route
// `/api/api/health` (double-prefixed, never matches) and `{ path: 'docs' }`
// into `/api/docs` (wrongly prefixed — the real route is bare `/docs`) — i.e.
// every entry breaks, just in opposite directions. A plain string comparison
// against the real request path has no equivalent failure mode.
/**
 * Path prefixes exempt for NON-GET methods, keyed by method.
 *
 * Payment gateways POST to these routes from their own infrastructure. They
 * cannot send `Authorization: Bearer` and they cannot send `x-origin-auth`
 * (a server-side shared secret that must never leave our own deployments), so
 * with only the GET-exempt list above every real webhook delivery was rejected
 * with 403 in production. The consequence is not a cosmetic one: the async
 * settlement path is what marks an order paid when the customer closes the tab
 * or the redirect is lost, so orders could sit in AWAITING_PAYMENT after the
 * customer had been charged.
 *
 * Signature verification IS the authentication for these routes — see
 * PaymentWebhooksController's own doc comment and IngestWebhookUseCase, which
 * verifies an HMAC over the exact raw bytes and rejects on mismatch before
 * anything is persisted. Prefix-matched because the provider is a path param.
 */
const ORIGIN_AUTH_EXEMPT_PATH_PREFIXES_BY_METHOD: Record<string, readonly string[]> = {
  POST: ['/api/v1/payments/webhooks/'],
};

/**
 * Constant-time comparison over equal-length SHA-256 digests.
 *
 * `!==` on strings short-circuits at the first differing byte. Exploiting that
 * across the public internet is impractical, but hashing to a fixed length
 * costs one line and also avoids timingSafeEqual's equal-length requirement
 * leaking the secret's length.
 */
function timingSafeStringEquals(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hb = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

const ORIGIN_AUTH_EXEMPT_GET_PATHS = new Set([
  '/api/health',
  // '/api/metrics' is deliberately absent: the unauthenticated metrics route
  // was removed (see PrometheusController), so exempting it would only
  // re-open a path that no longer needs to exist. '/metrics/auth' keeps its
  // exemption because it carries its own Basic-auth check and is what
  // Prometheus/Grafana actually scrapes — that check's own safety assumption
  // (must always sit behind Cloudflare's TLS termination) is documented on
  // PrometheusController itself; both comments should stay in sync.
  '/api/metrics/auth',
  '/robots.txt',
  '/docs',
  '/docs-json',
  '/docs-yaml',
]);

/**
 * OriginAuthMiddleware
 *
 * Responsibilities:
 * - Infra probes and Swagger's own routes (`ORIGIN_AUTH_EXEMPT_GET_PATHS`, GET only)
 *   always bypass the check, in every environment.
 * - When `appConfig.nodeEnv === 'development'` the check is bypassed to ease local
 *   development and debugging (swagger, local admin UI).
 * - A request already carrying a signature-valid access token (Authorization: Bearer
 *   ..., or the `app_access_token` cookie) skips the origin-auth check — this is
 *   what lets apps/members/apps/backoffice's browser-side client islands
 *   (`shared/api/client.ts`) call the API directly without ever shipping
 *   `ORIGIN_AUTH_SECRET` into the JS bundle. It's not a weaker check: only a token
 *   signed with the real access secret verifies, so this can't be satisfied by sending
 *   *some* header — JwtAuthGuard still independently re-verifies and enforces
 *   per-route downstream, this is only an early, cheap bypass.
 * - Otherwise (no valid session — anonymous/public requests, login/register attempts,
 *   non-browser callers) the middleware requires the request to include header
 *   `HttpHeaders.ORIGIN_AUTH` (`x-origin-auth`) that exactly matches the configured
 *   secret (from `corsConfig.originAuthSecret`).
 * - On mismatch or missing secret a 403 is returned (via Nest exception flow).
 */
@Injectable()
export class OriginAuthMiddleware implements NestMiddleware {
  private readonly loggerContext = OriginAuthMiddleware.name;

  constructor(
    @Inject(CORS_RUNTIME_CONFIG_TOKEN)
    private readonly corsConfig: CorsRuntimeConfig,
    @Inject(APP_RUNTIME_CONFIG_TOKEN)
    private readonly appConfig: AppRuntimeConfig,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Inject(TOKEN_PORT_TOKEN) private readonly tokenPort: TokenPort,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.method === 'GET' && ORIGIN_AUTH_EXEMPT_GET_PATHS.has(req.path)) {
        return next();
      }

      const methodPrefixes = ORIGIN_AUTH_EXEMPT_PATH_PREFIXES_BY_METHOD[req.method];
      if (methodPrefixes?.some((prefix) => req.path.startsWith(prefix))) {
        return next();
      }

      if (this.appConfig.nodeEnv === 'development') {
        // Local dev: do not enforce origin header to keep tooling usable.
        return next();
      }

      if (await this.hasValidAccessToken(req)) {
        return next();
      }

      const expected = this.corsConfig.originAuthSecret?.replace(/\s+/g, '');
      if (!expected) {
        this.logger.warn(
          'Origin auth secret not configured; rejecting request',
          this.loggerContext,
        );
        throw new ForbiddenException('forbidden');
      }

      const got = (req.header(HttpHeaders.ORIGIN_AUTH) || '').replace(/\s+/g, '');
      if (!got || !timingSafeStringEquals(got, expected)) {
        this.logger.warn(
          JSON.stringify({
            got: got ? '[REDACTED]' : '[missing]',
          }),
          this.loggerContext,
        );
        throw new ForbiddenException('forbidden');
      }

      return next();
    } catch (err) {
      // Convert unexpected errors into a 500 so we fail closed and log the issue.
      if (err instanceof ForbiddenException) throw err;
      this.logger.error(
        'Origin auth middleware error',
        JSON.stringify(err),
        this.loggerContext,
      );
      throw new InternalServerErrorException('origin auth error');
    }
  }

  private async hasValidAccessToken(req: Request): Promise<boolean> {
    const authHeader = req.header(HttpHeaders.AUTHORIZATION);
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : undefined;
    const token = bearerToken || this.extractCookie(req, ACCESS_TOKEN_COOKIE);
    if (!token) return false;

    try {
      await this.tokenPort.verifyAccess(token);
      return true;
    } catch {
      // Missing/expired/forged token — fall through to requiring X-Origin-Auth.
      return false;
    }
  }

  // Reads the raw `Cookie` header directly instead of `req.cookies` — this
  // middleware can run before `cookie-parser` in the stack, so `req.cookies`
  // isn't guaranteed to be populated yet.
  private extractCookie(req: Request, name: string): string | undefined {
    const header = req.headers.cookie;
    if (!header) return undefined;

    const prefix = `${name}=`;
    const match = header.split(';').find((part) => part.trim().startsWith(prefix));
    if (!match) return undefined;

    try {
      return decodeURIComponent(match.trim().slice(prefix.length));
    } catch {
      return undefined;
    }
  }
}
