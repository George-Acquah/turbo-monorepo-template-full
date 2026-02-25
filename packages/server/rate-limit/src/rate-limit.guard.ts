/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_SKIP_META, RATE_LIMIT_POLICY_META } from '@repo/constants';
import { LOGGER_TOKEN, LoggerPort, RATE_LIMIT_TOKEN, RateLimitPort } from '@repo/ports';
import { AppRequest, Response, RateLimitPolicy } from '@repo/types';

const DEFAULT_POLICY: RateLimitPolicy = {
  limit: 60,
  windowSeconds: 60,
  keyPrefix: 'api',
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly context = RateLimitGuard.name;

  constructor(
    private readonly reflector: Reflector,
    @Inject(RATE_LIMIT_TOKEN) private readonly limiter: RateLimitPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(RATE_LIMIT_SKIP_META, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (skip) return true;

    const override = this.reflector.getAllAndOverride<Partial<RateLimitPolicy>>(
      RATE_LIMIT_POLICY_META,
      [ctx.getHandler(), ctx.getClass()],
    );

    const policy: RateLimitPolicy = {
      ...DEFAULT_POLICY,
      ...(override || {}),
    };

    const http = ctx.switchToHttp();
    const req = http.getRequest<AppRequest>();
    const res = http.getResponse<Response>();

    const tracker = this.resolveTracker(req);
    const routeKey = this.resolveRouteKey(ctx, req, policy);

    const decision = await this.limiter.check({
      tracker,
      routeKey,
      policy,
    });

    this.setHeaders(res, decision);

    if (!decision.allowed) {
      this.logger.warn(
        `Rate limit exceeded: tracker=${tracker} route=${routeKey} limit=${decision.limit}`,
        this.context,
      );
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private resolveTracker(req: AppRequest): string {
    // Best default for scale:
    // tenantId ?? userId ?? ip
    const tenantId =
      (req.headers?.['x-tenant-id'] as string | undefined) ||
      (req.headers?.['X-Tenant-Id'] as string | undefined) ||
      req.user?.tenantId;

    const userId =
      (req.user?.id as string | undefined) || (req.headers?.['x-user-id'] as string | undefined);

    const ip =
      req.ip ||
      (req.headers?.['x-forwarded-for'] as string | undefined)?.split(',')?.[0]?.trim() ||
      (req.headers?.['x-real-ip'] as string | undefined) ||
      'unknown';

    return tenantId ?? userId ?? ip;
  }

  private resolveRouteKey(ctx: ExecutionContext, req: AppRequest, policy: RateLimitPolicy): string {
    // Avoid per-url cardinality explosion.
    // Use controller+handler by default; allow policy.routeKey override.
    if (policy.routeKey) return policy.routeKey;

    const handler = ctx.getHandler()?.name || 'handler';
    const klass = ctx.getClass()?.name || 'controller';

    // If you *really* want path-based keys, swap this to req.originalUrl.
    return `${klass}.${handler}`;
  }

  private setHeaders(res: Response, decision: any) {
    try {
      res.setHeader('X-RateLimit-Limit', String(decision.limit));
      res.setHeader('X-RateLimit-Remaining', String(decision.remaining));
      res.setHeader('X-RateLimit-Reset', String(decision.resetAtEpochSeconds));
      if (!decision.allowed) {
        res.setHeader('Retry-After', String(decision.retryAfterSeconds ?? 1));
      }
    } catch {
      // ignore header failures
    }
  }
}

// import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { THROTTLER_LIMIT, THROTTLER_TTL, THROTTLER_PREFIX } from '@repo/constants';
// import { RedisRateLimitStore } from './rate-limit.store';
// import { LOGGER_TOKEN, LoggerPort } from '@repo/ports';
// import { AppRequest, Response } from '@repo/types';

// @Injectable()
// export class RateLimitGuard implements CanActivate {
//   private readonly contextName = RateLimitGuard.name;

//   constructor(
//     private readonly reflector: Reflector,
//     private readonly store: RedisRateLimitStore,
//     @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
//   ) {}

//   async canActivate(ctx: ExecutionContext): Promise<boolean> {
//     const req = ctx.switchToHttp().getRequest<AppRequest>();
//     const res = ctx.switchToHttp().getResponse<Response>();

//     const handler = ctx.getHandler();
//     const clazz = ctx.getClass();

//     const limitMeta =
//       this.reflector.get<number>(THROTTLER_LIMIT, handler) ??
//       this.reflector.get<number>(THROTTLER_LIMIT, clazz);

//     const ttlMeta =
//       this.reflector.get<number>(THROTTLER_TTL, handler) ??
//       this.reflector.get<number>(THROTTLER_TTL, clazz);

//     const prefixMeta =
//       this.reflector.get<string>(THROTTLER_PREFIX, handler) ??
//       this.reflector.get<string>(THROTTLER_PREFIX, clazz);

//     // Default policy (can be changed centrally)
//     const isAuthed = Boolean(req.user?.id);
//     const limit = limitMeta ?? (isAuthed ? 60 : 20);
//     const ttlSeconds = ttlMeta ?? 60;

//     // identity strategy: tenantId ?? userId ?? ip
//     const tenantId = req.user?.tenantId ?? req.headers['x-tenant-id'];
//     const userId = req.user?.id;
//     const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

//     const identity = String(tenantId ?? userId ?? ip);

//     // route grouping (optional but recommended for fairness)
//     // Example: "GET:/v1/payments"
//     const routeGroup = prefixMeta ?? `${req.method}:${req.route?.path ?? req.path ?? 'unknown'}`;

//     // scope selection example:
//     // - auth endpoints: scope='auth'
//     // - email endpoints: scope='email'
//     // - otherwise: scope='api'
//     const scope: 'api' | 'auth' | 'email' = routeGroup.includes('/auth')
//       ? 'auth'
//       : routeGroup.includes('/email')
//         ? 'email'
//         : 'api';

//     const result = await this.store.consume({
//       scope,
//       identity,
//       route: routeGroup,
//       limit,
//       ttlSeconds,
//     });

//     // Headers (standard-ish)
//     res.setHeader('X-RateLimit-Limit', String(result.limit));
//     res.setHeader('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));
//     res.setHeader('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + result.resetSeconds));

//     if (!result.allowed) {
//       // Keep it simple; your global exception filter can format it
//       this.logger.warn(
//         `Rate limited: identity=${identity} scope=${scope} route=${routeGroup}`,
//         this.contextName,
//       );
//       res.status(429).send({ message: 'Too many requests' });
//       return false;
//     }

//     return true;
//   }
// }
