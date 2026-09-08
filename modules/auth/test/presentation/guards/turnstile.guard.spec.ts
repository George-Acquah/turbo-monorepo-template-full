import { describe, it, expect, beforeEach } from '@jest/globals';
import type { ExecutionContext } from '@nestjs/common';
import type { CaptchaVerifierPort, ContextPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { TurnstileVerificationFailedException } from '@workspace/auth-core';
import { TurnstileGuard } from '../../../src/presentation/guards/turnstile.guard';

function createExecutionContext(body: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ body }),
    }),
  } as unknown as ExecutionContext;
}

describe('TurnstileGuard', () => {
  let captcha: ReturnType<typeof createMock<Pick<CaptchaVerifierPort, 'verify'>>>;
  let context: ReturnType<typeof createMock<Pick<ContextPort, 'getIp'>>>;
  let guard: TurnstileGuard;

  beforeEach(() => {
    captcha = createMock<Pick<CaptchaVerifierPort, 'verify'>>(['verify']);
    context = createMock<Pick<ContextPort, 'getIp'>>(['getIp']);
    context.getIp.mockReturnValue('1.2.3.4');
    guard = new TurnstileGuard(
      captcha as unknown as CaptchaVerifierPort,
      context as unknown as ContextPort,
    );
  });

  it('allows the request through when verification succeeds', async () => {
    captcha.verify.mockResolvedValue({ success: true });

    const ctx = createExecutionContext({ turnstileToken: 'a-valid-token' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(captcha.verify).toHaveBeenCalledWith({ token: 'a-valid-token', remoteIp: '1.2.3.4' });
  });

  it('throws TurnstileVerificationFailedException when verification fails', async () => {
    captcha.verify.mockResolvedValue({ success: false });

    const ctx = createExecutionContext({ turnstileToken: 'a-bad-token' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(TurnstileVerificationFailedException);
  });

  it('fails closed with an empty token when turnstileToken is missing from the body', async () => {
    captcha.verify.mockResolvedValue({ success: false });

    const ctx = createExecutionContext({});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(TurnstileVerificationFailedException);
    expect(captcha.verify).toHaveBeenCalledWith({ token: '', remoteIp: '1.2.3.4' });
  });
});
