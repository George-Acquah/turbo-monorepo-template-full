import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { ContextPort, LoggerPort } from '@repo/ports';
import { HttpExceptionEnvelopeFilter } from '@repo/filters';

function createHttpHost(request: Record<string, unknown>, response: Record<string, unknown>): ArgumentsHost {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as ArgumentsHost;
}

describe('HttpExceptionEnvelopeFilter', () => {
  const contextPort = {
    isInContext: () => true,
    getRequestId: () => 'corr-500',
    getMethod: () => 'POST',
    getRoutePath: () => '/api/probe/validate',
    getIp: () => '127.0.0.1',
    getUserAgent: () => 'jest',
    getDeviceId: () => 'device-2',
  } as unknown as ContextPort;

  const logger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  } as unknown as LoggerPort;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes validation errors into the REST error envelope', () => {
    const filter = new HttpExceptionEnvelopeFilter(contextPort, logger);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const host = createHttpHost(
      {
        method: 'POST',
        url: '/api/probe/validate',
        headers: {
          'user-agent': 'jest',
          'x-device-id': 'device-2',
        },
        ip: '127.0.0.1',
      },
      response,
    );

    filter.catch(
      new BadRequestException({
        message: ['name must be a string', 'name should not be empty'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      data: null,
      message: 'name must be a string; name should not be empty',
      error: 'Bad Request',
      errorCode: null,
      errors: ['name must be a string', 'name should not be empty'],
      meta: {
        method: 'POST',
        path: '/api/probe/validate',
        ip: '127.0.0.1',
        userAgent: 'jest',
        deviceId: 'device-2',
      },
      correlationId: 'corr-500',
      timestamp: expect.any(String),
    });
  });

  it('normalizes unknown errors and logs them', () => {
    const filter = new HttpExceptionEnvelopeFilter(contextPort, logger);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const host = createHttpHost(
      {
        method: 'GET',
        url: '/api/probe/internal',
        headers: {
          'user-agent': 'jest',
        },
        ip: '127.0.0.1',
      },
      response,
    );

    filter.catch(new Error('boom'), host);

    expect(logger.error).toHaveBeenCalledWith(
      'boom',
      expect.any(String),
      HttpExceptionEnvelopeFilter.name,
    );
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      }),
    );
  });

  it('rethrows when invoked outside HTTP transport', () => {
    const filter = new HttpExceptionEnvelopeFilter(contextPort, logger);
    const host = {
      getType: () => 'ws',
    } as ArgumentsHost;

    expect(() => filter.catch(new Error('boom'), host)).toThrow('boom');
  });
});
