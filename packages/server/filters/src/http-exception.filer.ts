import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import type { AppRequest, Response as ExpressResponse } from '@repo/types';
import { CONTEXT_TOKEN, ContextPort, LOGGER_TOKEN, LoggerPort } from '@repo/ports';
import {
  buildHttpRequestMeta,
  createHttpErrorEnvelope,
  getCorrelationId,
  getCorrelationIdFromHttpRequest,
} from '@repo/utils';
import { normalizeException } from './exception-normalization';

@Catch()
@Injectable()
export class HttpExceptionEnvelopeFilter implements ExceptionFilter {
  constructor(
    @Inject(CONTEXT_TOKEN) private readonly ctx: ContextPort,
    @Optional() @Inject(LOGGER_TOKEN) private readonly logger?: LoggerPort,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType<'http' | 'ws' | 'rpc'>() !== 'http') {
      throw exception;
    }

    const http = host.switchToHttp();
    const res = http.getResponse<ExpressResponse>();
    const req = http.getRequest<AppRequest>();

    if (!(exception instanceof Error)) {
      this.logger?.error(
        `Unhandled non-error exception: ${String(exception)}`,
        undefined,
        HttpExceptionEnvelopeFilter.name,
      );
    } else if (!(exception as Error).name.endsWith('Exception')) {
      this.logger?.error(
        exception.message,
        exception.stack,
        HttpExceptionEnvelopeFilter.name,
      );
    }

    const normalized = normalizeException(exception);
    const payload = createHttpErrorEnvelope(normalized.statusCode, {
      message: normalized.message,
      error: normalized.error,
      errorCode: normalized.errorCode,
      errors: normalized.errors,
      correlationId: getCorrelationId(this.ctx, getCorrelationIdFromHttpRequest(req)),
      meta: buildHttpRequestMeta(this.ctx, req),
    });

    return res.status(normalized.statusCode).json(payload);
  }
}
