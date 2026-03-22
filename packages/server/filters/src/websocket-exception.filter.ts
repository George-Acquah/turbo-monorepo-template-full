import { ArgumentsHost, Catch, ExceptionFilter, Inject, Injectable, Optional } from '@nestjs/common';
import { CONTEXT_TOKEN, ContextPort, LOGGER_TOKEN, LoggerPort } from '@repo/ports';
import {
  buildWebSocketMeta,
  createWebSocketErrorPayload,
  getCorrelationId,
  getCorrelationIdFromWebSocketClient,
} from '@repo/utils';
import { normalizeException } from './exception-normalization';

type WebSocketClient = {
  emit?: (event: string, payload: unknown) => void;
  id?: string;
  handshake?: {
    address?: string;
    headers?: Record<string, unknown>;
    query?: Record<string, unknown>;
    url?: string;
  };
  nsp?: {
    name?: string;
  };
};

@Catch()
@Injectable()
export class WebSocketExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(CONTEXT_TOKEN) private readonly ctx: ContextPort,
    @Optional() @Inject(LOGGER_TOKEN) private readonly logger?: LoggerPort,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType<'http' | 'ws' | 'rpc'>() !== 'ws') {
      throw exception;
    }

    const client = host.switchToWs().getClient<WebSocketClient>();
    const normalized = normalizeException(exception);

    if (!(exception instanceof Error) || !exception.name.endsWith('Exception')) {
      this.logger?.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
        WebSocketExceptionFilter.name,
      );
    }

    const payload = createWebSocketErrorPayload({
      message: normalized.message,
      error: normalized.error,
      errorCode: normalized.errorCode,
      errors: normalized.errors,
      correlationId: getCorrelationId(
        this.ctx,
        getCorrelationIdFromWebSocketClient(client),
      ),
      meta: buildWebSocketMeta(this.ctx, client),
    });

    client?.emit?.('exception', payload);

    return payload;
  }
}
