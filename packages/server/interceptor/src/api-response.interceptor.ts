/**
 * ============================================================================
 * HTTP RESPONSE ENVELOPE INTERCEPTOR
 * ============================================================================
 *
 * Wraps all successful HTTP responses in a standardized envelope.
 *
 * Uses the unified lifecycle engine to ensure consistent:
 *   - Correlation ID extraction
 *   - Request metadata building
 *   - Response context creation
 *   - Envelope wrapping
 *
 * This eliminates duplication with the exception filter by using shared
 * context-building logic from the lifecycle engine.
 */

import type { Response as ExpressResponse } from '@workspace/types/express';
import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
  NestInterceptor,
  RequestMethod,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { CONTEXT_TOKEN, ContextPort } from '@workspace/ports';
import { SKIP_HTTP_RESPONSE_ENVELOPE_KEY } from '@workspace/decorators';
import {
  createHttpSuccessEnvelope,
  isNoContentStatus,
  buildResponseContextFromRequest,
  extractLifecycleRequestContext,
  toTransport,
  buildHttpRequestMeta,
} from '@workspace/utils/request';
import { HTTP_CODE_METADATA, METHOD_METADATA } from '@nestjs/common/constants.js';

@Injectable()
export class HttpResponseEnvelopeInterceptor<T> implements NestInterceptor<T, unknown> {
  constructor(
    @Inject(CONTEXT_TOKEN) private readonly ctx: ContextPort,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    // Only intercept HTTP requests
    if (context.getType<'http' | 'ws' | 'rpc'>() !== 'http') {
      return next.handle();
    }

    // Check if endpoint is marked to skip envelope wrapping
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_HTTP_RESPONSE_ENVELOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse<ExpressResponse>();

    // Extract all request-level context ONCE using lifecycle engine
    const lifecycleContext = extractLifecycleRequestContext(req, this.ctx, buildHttpRequestMeta);

    return next.handle().pipe(
      map((data) => {
        // Resolve HTTP status code
        const statusCode = this.resolveStatusCode(context, res);

        // Handle 204 No Content (no body needed)
        if (isNoContentStatus(statusCode)) {
          if (typeof res?.status === 'function') res.status(statusCode);
          return undefined;
        }

        // Extract pagination metadata from response data
        const paginationMeta = this.extractPaginationMeta(data);

        // Build response context using lifecycle engine
        // Combines request metadata + response metadata (pagination)
        const responseCtx = buildResponseContextFromRequest(lifecycleContext, paginationMeta);

        // Serialize data for transport (BigInt → string, Date → ISO, etc.)
        const serializedData = toTransport(data);

        // Create pure envelope with injected context
        const wrapped = createHttpSuccessEnvelope(statusCode, serializedData, responseCtx);

        // Set HTTP response status
        if (typeof res?.status === 'function') res.status(statusCode);

        return wrapped;
      }),
    );
  }

  /**
   * RESOLVE HTTP STATUS CODE
   *
   * Determines HTTP status code using priority:
   *   1. Express response status (if already set)
   *   2. Explicit @HttpCode() decorator
   *   3. HTTP request method (POST → 201 Created, others → 200 OK)
   */
  private resolveStatusCode(context: ExecutionContext, res: ExpressResponse): number {
    // Check if response status already set by controller
    if (typeof res?.statusCode === 'number' && res.statusCode > 0) {
      return res.statusCode;
    }

    // Check for @HttpCode() decorator
    const explicitHttpCode = this.reflector.getAllAndOverride<number>(HTTP_CODE_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (typeof explicitHttpCode === 'number' && explicitHttpCode > 0) {
      return explicitHttpCode;
    }

    // Use request method to infer status
    const requestMethod = this.reflector.getAllAndOverride<RequestMethod>(METHOD_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requestMethod === RequestMethod.POST) {
      return HttpStatus.CREATED;
    }

    return HttpStatus.OK;
  }

  /**
   * EXTRACT PAGINATION METADATA
   *
   * Detects if response is a paginated list and extracts pagination info.
   * Returns null if data is not paginated.
   */
  private extractPaginationMeta(data: unknown): Record<string, unknown> | null {
    if (!data || typeof data !== 'object') return null;
    const candidate = data as Record<string, unknown>;

    // Expect the new pagination shape only: { items: T[], meta: PaginationMeta }
    if (Array.isArray(candidate.items) && candidate.meta && typeof candidate.meta === 'object') {
      return { pagination: candidate.meta };
    }

    // No pagination metadata found (do not attempt legacy detection)
    return null;
  }
}
