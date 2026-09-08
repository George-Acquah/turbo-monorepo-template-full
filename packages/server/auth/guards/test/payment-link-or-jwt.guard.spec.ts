import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { PaymentLinkOrJwtGuard } from '../src/payment-link-or-jwt.guard';
import type { JwtAuthGuard } from '../src/jwt-auth.guard';
import type { PaymentLinkTokenService } from '../src/payment-link-token.service';

describe('PaymentLinkOrJwtGuard', () => {
  let jwtAuthGuard: { canActivate: ReturnType<typeof jest.fn> };
  let paymentLinkTokens: { sign: ReturnType<typeof jest.fn>; verify: ReturnType<typeof jest.fn> };
  let guard: PaymentLinkOrJwtGuard;

  function contextWithAuthHeader(authorization?: string): ExecutionContext {
    const request: { headers: { authorization?: string }; user?: unknown } = {
      headers: { authorization },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jwtAuthGuard = { canActivate: jest.fn() };
    paymentLinkTokens = { sign: jest.fn(), verify: jest.fn() };
    guard = new PaymentLinkOrJwtGuard(
      jwtAuthGuard as unknown as JwtAuthGuard,
      paymentLinkTokens as unknown as PaymentLinkTokenService,
    );
  });

  it('resolves via JWT when the JWT guard succeeds', async () => {
    jwtAuthGuard.canActivate.mockResolvedValue(true);
    const context = contextWithAuthHeader('Bearer some.jwt.token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(paymentLinkTokens.verify).not.toHaveBeenCalled();
  });

  it('falls back to a valid payment-link token when JWT fails', async () => {
    jwtAuthGuard.canActivate.mockRejectedValue(new UnauthorizedException());
    paymentLinkTokens.verify.mockReturnValue({
      sub: 'prf_1',
      scope: 'payment',
      orderId: 'ord_1',
    });
    const context = contextWithAuthHeader('Bearer plt-token.sig');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest<{ user?: unknown }>();
    expect(request.user).toEqual({
      profileId: 'prf_1',
      orderId: 'ord_1',
      enrolmentId: undefined,
      source: 'payment-link',
    });
  });

  it('rejects an expired payment-link token', async () => {
    jwtAuthGuard.canActivate.mockRejectedValue(new UnauthorizedException());
    paymentLinkTokens.verify.mockReturnValue({
      sub: 'prf_1',
      scope: 'payment',
      exp: Date.now() - 1000,
    });
    const context = contextWithAuthHeader('Bearer plt-token.sig');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token with the wrong scope', async () => {
    jwtAuthGuard.canActivate.mockRejectedValue(new UnauthorizedException());
    paymentLinkTokens.verify.mockReturnValue({ sub: 'prf_1', scope: 'other' });
    const context = contextWithAuthHeader('Bearer plt-token.sig');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when there is no bearer token at all', async () => {
    jwtAuthGuard.canActivate.mockRejectedValue(new UnauthorizedException());
    const context = contextWithAuthHeader(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(paymentLinkTokens.verify).not.toHaveBeenCalled();
  });

  it('rejects a malformed payment-link token (signature verification throws)', async () => {
    jwtAuthGuard.canActivate.mockRejectedValue(new UnauthorizedException());
    paymentLinkTokens.verify.mockImplementation(() => {
      throw new Error('bad signature');
    });
    const context = contextWithAuthHeader('Bearer garbage');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
