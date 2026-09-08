/**
 * ============================================================================
 * HTTP EXCEPTION ENVELOPE FILTER
 * ============================================================================
 *
 * Catches all exceptions and wraps them in standardized error envelopes.
 *
 * Uses the unified lifecycle engine to ensure consistent:
 *   - Correlation ID extraction
 *   - Request metadata building
 *   - Response context creation
 *   - Error envelope wrapping
 *
 * This eliminates duplication with the response interceptor by using shared
 * context-building logic from the lifecycle engine.
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import type { AppRequest, Response as ExpressResponse } from '@workspace/types';
import { CONTEXT_TOKEN, ContextPort, LOGGER_TOKEN, LoggerPort } from '@workspace/ports';
import {
  normalizeException,
  extractLifecycleRequestContext,
  buildHttpRequestMeta,
  buildResponseContextFromRequest,
  createHttpErrorEnvelope,
} from '@workspace/utils/request';

@Catch()
@Injectable()
export class HttpExceptionEnvelopeFilter implements ExceptionFilter {
  constructor(
    @Inject(CONTEXT_TOKEN) private readonly ctx: ContextPort,
    @Optional() @Inject(LOGGER_TOKEN) private readonly logger?: LoggerPort,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    //  Only handle HTTP exceptions
    if (host.getType<'http' | 'ws' | 'rpc'>() !== 'http') {
      throw exception;
    }

    const http = host.switchToHttp();
    const res = http.getResponse<ExpressResponse>();
    const req = http.getRequest<AppRequest>();

    //  Log non-standard exceptions
    if (!(exception instanceof Error)) {
      this.logger?.error(
        `Unhandled non-error exception: ${String(exception)}`,
        undefined,
        HttpExceptionEnvelopeFilter.name,
      );
    } else if (!(exception as Error).name.endsWith('Exception')) {
      this.logger?.error(exception.message, exception.stack, HttpExceptionEnvelopeFilter.name);
    }

    //  Normalize exception to standard format
    const normalized = normalizeException(exception);

    //  Extract all request-level context ONCE using lifecycle engine
    const lifecycleContext = extractLifecycleRequestContext(req, this.ctx, buildHttpRequestMeta);

    //  Build response context using lifecycle engine
    // Include pagination meta if the caught exception includes any useful pagination info
    // (some services may throw structured error objects that contain partial response info)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const additionalMeta = (normalized as any)?.meta ?? null;
    const responseCtx = buildResponseContextFromRequest(
      lifecycleContext,
      additionalMeta ?? undefined,
    );

    //  Create pure error envelope with injected context
    const payload = createHttpErrorEnvelope(normalized.statusCode, responseCtx, {
      message: normalized.message,
      error: normalized.error,
      errorCode: normalized.errorCode,
      errors: normalized.errors,
    });

    //  Return error response
    return res.status(normalized.statusCode).json(payload);
  }
}
