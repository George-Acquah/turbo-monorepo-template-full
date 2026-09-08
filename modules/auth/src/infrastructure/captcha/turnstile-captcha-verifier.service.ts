import { Inject, Injectable } from '@nestjs/common';
import {
  CaptchaVerifierPort,
  CaptchaVerifyRequest,
  CaptchaVerifyResult,
  LOGGER_TOKEN,
  type LoggerPort,
} from '@workspace/ports';
import { CAPTCHA_RUNTIME_CONFIG_TOKEN, type CaptchaRuntimeConfig } from '@workspace/ports/config';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface SiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

/**
 * Verifies Cloudflare Turnstile tokens server-side via the siteverify API.
 * Used by `TurnstileGuard` on the register/login routes, before any
 * credential/DB work happens. Mirrors apps/landing's `verifyTurnstileToken`
 * (src/lib/turnstile.ts) — same siteverify call shape, adapted to this
 * module's port/DI conventions.
 *
 * Module-local (not shared infra): only modules/auth consumes this today —
 * see modules/CLAUDE.md's "infrastructure/ — ... any adapter genuinely
 * unique to this module".
 */
@Injectable()
export class TurnstileCaptchaVerifierService extends CaptchaVerifierPort {
  private readonly context = TurnstileCaptchaVerifierService.name;

  constructor(
    @Inject(CAPTCHA_RUNTIME_CONFIG_TOKEN) private readonly cfg: CaptchaRuntimeConfig,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {
    super();
  }

  async verify({ token, remoteIp }: CaptchaVerifyRequest): Promise<CaptchaVerifyResult> {
    if (!this.cfg.turnstileSecretKey) {
      this.logger.warn(
        'TURNSTILE_SECRET_KEY not configured; rejecting captcha verification',
        this.context,
      );
      return { success: false };
    }

    // Fail closed: a missing token is never treated as "verification not
    // required", it's an automatic failure.
    if (!token) return { success: false };

    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: this.cfg.turnstileSecretKey,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    });
    const data = (await res.json()) as SiteverifyResponse;

    return { success: data.success === true, errorCodes: data['error-codes'] };
  }
}
