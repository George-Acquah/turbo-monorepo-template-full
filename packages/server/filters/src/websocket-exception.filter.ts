import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { CONTEXT_TOKEN, ContextPort, LOGGER_TOKEN, LoggerPort } from '@workspace/ports';

// Assumed imports from your utils
import {
  buildResponseContextFromRequest,
  buildWebSocketMeta,
  createWebSocketErrorPayload,
  extractWsLifecycleRequestContext,
  normalizeException,
  // normalizeException,
  WebSocketClient,
} from '@workspace/utils/request';

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

    // 1. Extract WS-specific context using the CORRECT client object
    // Notice we use the new WS extractor here, safely passing 'client' instead of 'req'
    const lifecycleContext = extractWsLifecycleRequestContext(client, this.ctx, buildWebSocketMeta);

    // 2. Build standard response context through the unified core engine
    const responseCtx = buildResponseContextFromRequest(lifecycleContext);

    // 3. Create standard WS error payload, injecting the engine's standardized context
    const payload = createWebSocketErrorPayload(responseCtx, {
      message: normalized.message,
      error: normalized.error,
      errorCode: normalized.errorCode,
      errors: normalized.errors,
    });

    client?.emit?.('exception', payload);

    return payload;
  }
}
