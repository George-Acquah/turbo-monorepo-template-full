import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { HttpException, HttpStatus, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RateLimitPort, ContextPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { RateLimitGuard } from '../src/guards/rate-limit.guard';

function createExecutionContext(): { ctx: ExecutionContext; res: { setHeader: jest.Mock } } {
  const handler = function testHandler() {};
  class TestController {}
  const res = { setHeader: jest.fn() };
  const ctx = {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({ getResponse: () => res }),
  } as unknown as ExecutionContext;
  return { ctx, res };
}

describe('RateLimitGuard', () => {
  let reflector: ReturnType<typeof createMock<Pick<Reflector, 'getAllAndOverride'>>>;
  let rateLimit: ReturnType<typeof createMock<Pick<RateLimitPort, 'check'>>>;
  let context: ReturnType<typeof createMock<Pick<ContextPort, 'getUserIdOptional' | 'getIp'>>>;
  let guard: RateLimitGuard;

  beforeEach(() => {
    reflector = createMock<Pick<Reflector, 'getAllAndOverride'>>(['getAllAndOverride']);
    rateLimit = createMock<Pick<RateLimitPort, 'check'>>(['check']);
    context = createMock<Pick<ContextPort, 'getUserIdOptional' | 'getIp'>>([
      'getUserIdOptional',
      'getIp',
    ]);
    guard = new RateLimitGuard(
      reflector as unknown as Reflector,
      rateLimit as unknown as RateLimitPort,
      context as unknown as ContextPort,
    );
  });

  it('allows the request without checking when SkipRateLimit metadata is set', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true);
    const { ctx } = createExecutionContext();

    const allowed = await guard.canActivate(ctx);

    expect(allowed).toBe(true);
    expect(rateLimit.check).not.toHaveBeenCalled();
  });

  it('merges a RateLimit policy override on top of the default policy', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false); // skip
    reflector.getAllAndOverride.mockReturnValueOnce({ limit: 5 }); // override
    context.getUserIdOptional.mockReturnValue('user-1');
    rateLimit.check.mockResolvedValue({ allowed: true, limit: 5, remaining: 4, resetAtEpochSeconds: 0 });
    const { ctx } = createExecutionContext();

    await guard.canActivate(ctx);

    expect(rateLimit.check).toHaveBeenCalledWith(
      expect.objectContaining({
        tracker: 'user-1',
        policy: { limit: 5, windowSeconds: 60, keyPrefix: 'api' },
      }),
    );
  });

  it('falls back tracker from userId to ip to anonymous', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    reflector.getAllAndOverride.mockReturnValueOnce(undefined);
    context.getUserIdOptional.mockReturnValue(undefined);
    context.getIp.mockReturnValue('1.2.3.4');
    rateLimit.check.mockResolvedValue({ allowed: true, limit: 100, remaining: 99, resetAtEpochSeconds: 0 });
    const { ctx } = createExecutionContext();

    await guard.canActivate(ctx);

    expect(rateLimit.check).toHaveBeenCalledWith(expect.objectContaining({ tracker: '1.2.3.4' }));
  });

  it('sets X-RateLimit-* response headers on an allowed request', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    reflector.getAllAndOverride.mockReturnValueOnce(undefined);
    context.getUserIdOptional.mockReturnValue('user-1');
    rateLimit.check.mockResolvedValue({ allowed: true, limit: 100, remaining: 99, resetAtEpochSeconds: 1700 });
    const { ctx, res } = createExecutionContext();

    await guard.canActivate(ctx);

    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '99');
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', '1700');
    expect(res.setHeader).not.toHaveBeenCalledWith('Retry-After', expect.anything());
  });

  it('throws a 429 HttpException with retryAfterSeconds and sets Retry-After when the decision denies', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    reflector.getAllAndOverride.mockReturnValueOnce(undefined);
    context.getUserIdOptional.mockReturnValue('user-1');
    rateLimit.check.mockResolvedValue({
      allowed: false,
      limit: 100,
      remaining: 0,
      resetAtEpochSeconds: 0,
      retryAfterSeconds: 30,
    });
    const { ctx, res } = createExecutionContext();

    try {
      await guard.canActivate(ctx);
      throw new Error('expected canActivate to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const httpError = error as HttpException;
      expect(httpError.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(httpError.getResponse()).toMatchObject({ retryAfterSeconds: 30 });
      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '30');
    }
  });
});
