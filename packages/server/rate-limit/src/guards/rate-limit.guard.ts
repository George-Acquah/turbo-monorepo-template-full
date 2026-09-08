import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RATE_LIMIT_TOKEN,
  RateLimitPort,
  CONTEXT_TOKEN,
  ContextPort,
} from '@workspace/ports';
import { RATE_LIMIT_POLICY_META, RATE_LIMIT_SKIP_META } from '@workspace/constants';
import type { RateLimitPolicy } from '@workspace/types/contracts';
import type { Response } from '@workspace/types';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static readonly DEFAULT_POLICY: RateLimitPolicy = {
    limit: 100,
    windowSeconds: 60,
    keyPrefix: 'api',
  };

  constructor(
    private readonly reflector: Reflector,
    @Inject(RATE_LIMIT_TOKEN) private readonly rateLimit: RateLimitPort,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
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
    const policy: RateLimitPolicy = { ...RateLimitGuard.DEFAULT_POLICY, ...override };

    const tracker = this.context.getUserIdOptional() ?? this.context.getIp() ?? 'anonymous';
    const routeKey = `${ctx.getClass().name}.${ctx.getHandler().name}`;

    const decision = await this.rateLimit.check({ tracker, routeKey, policy });

    const res = ctx.switchToHttp().getResponse<Response>();
    res.setHeader('X-RateLimit-Limit', String(decision.limit));
    res.setHeader('X-RateLimit-Remaining', String(decision.remaining));
    res.setHeader('X-RateLimit-Reset', String(decision.resetAtEpochSeconds));

    if (!decision.allowed) {
      res.setHeader('Retry-After', String(decision.retryAfterSeconds));
      throw new HttpException(
        { message: 'Too many requests', retryAfterSeconds: decision.retryAfterSeconds },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
