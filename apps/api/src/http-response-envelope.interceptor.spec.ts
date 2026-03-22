import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ContextPort } from '@repo/ports';
import { lastValueFrom, of } from 'rxjs';
import { HttpResponseEnvelopeInterceptor } from '@repo/interceptor';

function createContextMock(overrides?: Record<string, unknown>): ExecutionContext {
  const response = {
    statusCode: 200,
    status: jest.fn().mockReturnThis(),
  };

  return {
    getType: () => 'http',
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        url: '/api/probe',
        headers: {
          'user-agent': 'jest',
          'x-device-id': 'device-1',
        },
        ip: '127.0.0.1',
      }),
      getResponse: () => response,
      getNext: () => undefined,
    }),
    ...overrides,
  } as unknown as ExecutionContext;
}

describe('HttpResponseEnvelopeInterceptor', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const contextPort = {
    isInContext: () => true,
    getRequestId: () => 'corr-123',
    getMethod: () => 'GET',
    getRoutePath: () => '/api/probe',
    getIp: () => '127.0.0.1',
    getUserAgent: () => 'jest',
    getDeviceId: () => 'device-1',
  } as unknown as ContextPort;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('wraps plain HTTP responses into the standard envelope', async () => {
    const interceptor = new HttpResponseEnvelopeInterceptor(contextPort, reflector);
    const context = createContextMock({
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url: '/api/probe',
          headers: {
            'user-agent': 'jest',
            'x-device-id': 'device-1',
          },
          ip: '127.0.0.1',
        }),
        getResponse: () => ({
          statusCode: 201,
          status: jest.fn().mockReturnThis(),
        }),
        getNext: () => undefined,
      }),
    });

    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

    const result = await lastValueFrom(
      interceptor.intercept(context, {
        handle: () =>
          of({
            id: 42n,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
          }),
      }),
    );

    expect(result).toEqual({
      success: true,
      statusCode: 201,
      data: {
        id: '42',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      message: null,
      meta: {
        method: 'GET',
        path: '/api/probe',
        ip: '127.0.0.1',
        userAgent: 'jest',
        deviceId: 'device-1',
      },
      correlationId: 'corr-123',
      timestamp: expect.any(String),
    });
  });

  it('returns no body for HTTP 204 responses', async () => {
    const interceptor = new HttpResponseEnvelopeInterceptor(contextPort, reflector);
    const response = {
      statusCode: 204,
      status: jest.fn().mockReturnThis(),
    };
    const context = createContextMock({
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'DELETE',
          url: '/api/probe/no-content',
          headers: {},
        }),
        getResponse: () => response,
        getNext: () => undefined,
      }),
    });

    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

    const result = await lastValueFrom(
      interceptor.intercept(context, {
        handle: () => of(undefined),
      }),
    );

    expect(result).toBeUndefined();
    expect(response.status).toHaveBeenCalledWith(204);
  });

  it('does not touch non-http transports', async () => {
    const interceptor = new HttpResponseEnvelopeInterceptor(contextPort, reflector);
    const payload = { event: 'ready' };

    const result = await lastValueFrom(
      interceptor.intercept(
        {
          getType: () => 'ws',
        } as ExecutionContext,
        {
          handle: () => of(payload),
        },
      ),
    );

    expect(result).toBe(payload);
    expect(reflector.getAllAndOverride).not.toHaveBeenCalled();
  });
});
