import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import type { IdempotencyKeyRepositoryPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { IdempotencyInterceptor } from '../src/idempotency.interceptor';
import { IDEMPOTENT_SCOPE_META } from '../src/idempotent.decorator';

describe('IdempotencyInterceptor', () => {
  let reflector: { get: ReturnType<typeof jest.fn> };
  let idempotencyKeyRepo: ReturnType<
    typeof createMock<Pick<IdempotencyKeyRepositoryPort, 'findByKey' | 'begin' | 'complete' | 'fail'>>
  >;
  let interceptor: IdempotencyInterceptor;

  const buildContext = (
    body: Record<string, unknown> = {},
    headers: Record<string, string> = {},
  ): ExecutionContext => {
    const request = { method: 'POST', path: '/api/v1/auth/claim', body, headers };
    const response = { statusCode: 201 };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
      getHandler: () => (() => undefined),
    } as unknown as ExecutionContext;
  };

  const buildCallHandler = (result: unknown): CallHandler => ({
    handle: () => of(result),
  });

  beforeEach(() => {
    reflector = { get: jest.fn() };
    idempotencyKeyRepo = createMock<
      Pick<IdempotencyKeyRepositoryPort, 'findByKey' | 'begin' | 'complete' | 'fail'>
    >(['findByKey', 'begin', 'complete', 'fail']);

    interceptor = new IdempotencyInterceptor(
      reflector as unknown as Reflector,
      idempotencyKeyRepo as unknown as IdempotencyKeyRepositoryPort,
    );
  });

  it('passes through untouched when the route has no @Idempotent scope', async () => {
    reflector.get.mockReturnValue(undefined);
    const context = buildContext();
    const handler = buildCallHandler({ ok: true });

    const result = await firstValueFrom(interceptor.intercept(context, handler));

    expect(result).toEqual({ ok: true });
    expect(idempotencyKeyRepo.findByKey).not.toHaveBeenCalled();
  });

  it('passes through untouched when no Idempotency-Key header is sent', async () => {
    reflector.get.mockReturnValue('auth.claim');
    const context = buildContext({}, {});
    const handler = buildCallHandler({ ok: true });

    const result = await firstValueFrom(interceptor.intercept(context, handler));

    expect(result).toEqual({ ok: true });
    expect(idempotencyKeyRepo.findByKey).not.toHaveBeenCalled();
  });

  it('runs the handler and persists the response on a fresh key', async () => {
    reflector.get.mockReturnValue('auth.claim');
    idempotencyKeyRepo.findByKey.mockResolvedValue(null);
    idempotencyKeyRepo.begin.mockResolvedValue({ decision: 'EXECUTE' });
    const context = buildContext({ a: 1 }, { 'idempotency-key': 'key-1' });
    const handler = buildCallHandler({ ok: true });

    const result = await firstValueFrom(interceptor.intercept(context, handler));

    expect(idempotencyKeyRepo.begin).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'key-1', scope: 'auth.claim' }),
    );
    expect(idempotencyKeyRepo.complete).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'key-1', scope: 'auth.claim', statusCode: 201 }),
    );
    expect(result).toEqual({ ok: true });
  });

  it('replays the stored response instead of re-running the handler on SKIP', async () => {
    reflector.get.mockReturnValue('auth.claim');
    idempotencyKeyRepo.findByKey.mockResolvedValue({ requestHash: 'same-hash' } as never);
    idempotencyKeyRepo.begin.mockResolvedValue({ decision: 'SKIP', responseData: { cached: true } });
    const context = buildContext({ a: 1 }, { 'idempotency-key': 'key-1' });
    const handlerFn = jest.fn(() => of({ ok: true }));
    const handler: CallHandler = { handle: handlerFn as never };

    // Force the computed hash to match the stored one by reusing the same body.
    const result = await firstValueFrom(interceptor.intercept(context, handler));

    expect(result).toEqual({ cached: true });
    expect(handlerFn).not.toHaveBeenCalled();
  });

  it('rejects with 409 when the same key is reused with a different body', async () => {
    reflector.get.mockReturnValue('auth.claim');
    idempotencyKeyRepo.findByKey.mockResolvedValue({ requestHash: 'a-completely-different-hash' } as never);
    const context = buildContext({ a: 1 }, { 'idempotency-key': 'key-1' });
    const handler = buildCallHandler({ ok: true });

    await expect(firstValueFrom(interceptor.intercept(context, handler))).rejects.toMatchObject({
      response: expect.objectContaining({ errorCode: 'IDEMPOTENCY_KEY_REUSED' }),
    });
    expect(idempotencyKeyRepo.begin).not.toHaveBeenCalled();
  });

  it('calls fail and rethrows when the handler throws', async () => {
    reflector.get.mockReturnValue('auth.claim');
    idempotencyKeyRepo.findByKey.mockResolvedValue(null);
    idempotencyKeyRepo.begin.mockResolvedValue({ decision: 'EXECUTE' });
    const context = buildContext({ a: 1 }, { 'idempotency-key': 'key-1' });
    const boom = new Error('boom');
    const handler: CallHandler = { handle: () => throwError(() => boom) as never };

    await expect(firstValueFrom(interceptor.intercept(context, handler))).rejects.toBe(boom);
    expect(idempotencyKeyRepo.fail).toHaveBeenCalledWith({ key: 'key-1', scope: 'auth.claim' });
    expect(idempotencyKeyRepo.complete).not.toHaveBeenCalled();
  });
});
