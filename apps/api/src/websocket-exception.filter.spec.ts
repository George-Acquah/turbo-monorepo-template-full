import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ContextPort, LoggerPort } from '@repo/ports';
import { WebSocketExceptionFilter } from '@repo/filters';

function createWebSocketHost(client: Record<string, unknown>): ArgumentsHost {
  return {
    getType: () => 'ws',
    switchToWs: () => ({
      getClient: () => client,
    }),
  } as ArgumentsHost;
}

describe('WebSocketExceptionFilter', () => {
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

  it('emits a websocket-specific error payload without REST status fields', () => {
    const contextPort = {
      isInContext: () => false,
      getRequestId: () => 'unknown',
    } as unknown as ContextPort;
    const filter = new WebSocketExceptionFilter(contextPort, logger);
    const client = {
      id: 'socket-1',
      handshake: {
        address: '127.0.0.1',
        url: '/ws/probe',
        headers: {
          'x-correlation-id': 'ws-corr-1',
          'user-agent': 'socket-client',
        },
      },
      nsp: {
        name: '/probe',
      },
      emit: jest.fn(),
    };

    const host = createWebSocketHost(client);

    const result = filter.catch(
      new HttpException(
        {
          message: 'Socket access denied',
          error: 'Forbidden',
          errorCode: 'SOCKET_FORBIDDEN',
        },
        HttpStatus.FORBIDDEN,
      ),
      host,
    );

    expect(client.emit).toHaveBeenCalledWith(
      'exception',
      expect.objectContaining({
        success: false,
        message: 'Socket access denied',
        error: 'Forbidden',
        errorCode: 'SOCKET_FORBIDDEN',
        correlationId: 'ws-corr-1',
        meta: {
          socketId: 'socket-1',
          namespace: '/probe',
          path: '/ws/probe',
          ip: '127.0.0.1',
          userAgent: 'socket-client',
        },
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: 'Forbidden',
      }),
    );
    expect(result).not.toHaveProperty('statusCode');
  });

  it('rethrows when invoked outside websocket transport', () => {
    const contextPort = {
      isInContext: () => false,
      getRequestId: () => 'unknown',
    } as unknown as ContextPort;
    const filter = new WebSocketExceptionFilter(contextPort, logger);
    const host = {
      getType: () => 'http',
    } as ArgumentsHost;

    expect(() => filter.catch(new Error('boom'), host)).toThrow('boom');
  });
});
