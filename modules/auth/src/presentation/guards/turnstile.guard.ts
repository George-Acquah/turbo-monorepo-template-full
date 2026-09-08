import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import {
  CAPTCHA_VERIFIER_TOKEN,
  CaptchaVerifierPort,
  CONTEXT_TOKEN,
  type ContextPort,
} from '@workspace/ports';
import { TurnstileVerificationFailedException } from '@workspace/auth-core';

interface TurnstileRequestBody {
  turnstileToken?: unknown;
}

/**
 * Verifies a Cloudflare Turnstile token BEFORE any credential/DB work
 * happens on register/login. Must be a guard rather than DTO validation:
 * on the login route, `LocalAuthGuard`'s passport-local strategy reads
 * `req.body` before any `ValidationPipe` would run (see login.dto.ts's
 * header comment), so DTO decorators can never enforce this there. Guards
 * always run before route handlers, so the same mechanism is used
 * consistently on both register and login — see auth.controller.ts's
 * `@UseGuards(TurnstileGuard, LocalAuthGuard)` (array order = execution
 * order, Turnstile checked before credentials).
 */
@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(
    @Inject(CAPTCHA_VERIFIER_TOKEN) private readonly captcha: CaptchaVerifierPort,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{ body?: TurnstileRequestBody }>();
    const token = typeof req.body?.turnstileToken === 'string' ? req.body.turnstileToken : '';

    const result = await this.captcha.verify({
      token,
      remoteIp: this.context.getIp() ?? undefined,
    });
    if (!result.success) {
      throw new TurnstileVerificationFailedException();
    }

    return true;
  }
}
