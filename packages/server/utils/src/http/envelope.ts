import type {
  HttpErrorEnvelope,
  HttpErrorEnvelopeOptions,
  HttpSuccessEnvelope,
  HttpSuccessEnvelopeOptions,
} from '@workspace/types';
import type { ResponseContext } from '../response-lifecycle/context';

/**
 * ============================================================================
 * PURE HTTP ENVELOPE FACTORY
 * ============================================================================
 *
 * This layer creates HTTP response envelopes without side effects.
 * All context (correlationId, meta, timestamp) is INJECTED via ResponseContext,
 * not generated or extracted here.
 *
 * This ensures:
 *   ✓ Predictable envelope structure
 *   ✓ No hidden timestamp generation
 *   ✓ No implicit correlation ID logic
 *   ✓ Easy testing (pure functions)
 */

/**
 * CREATE HTTP SUCCESS ENVELOPE
 *
 * Wraps successful response data in standardized HTTP envelope.
 * All metadata comes from the injected ResponseContext.
 *
 * @param statusCode HTTP status code (200, 201, etc.)
 * @param data Response payload (already serialized)
 * @param ctx Pre-built ResponseContext with correlationId, meta, timestamp
 * @param options Additional envelope customization
 */
export function createHttpSuccessEnvelope<T>(
  statusCode: number,
  data: T,
  ctx: ResponseContext,
  options: HttpSuccessEnvelopeOptions = {},
): HttpSuccessEnvelope<T> {
  return {
    success: true,
    statusCode,
    data,
    message: options.message ?? null,
    meta: ctx.meta,
    correlationId: ctx.correlationId,
    timestamp: ctx.timestamp,
  };
}

/**
 * CREATE HTTP ERROR ENVELOPE
 *
 * Wraps error responses in standardized HTTP envelope.
 * All metadata comes from the injected ResponseContext.
 *
 * @param statusCode HTTP error status code (400, 404, 500, etc.)
 * @param ctx Pre-built ResponseContext
 * @param options Error details (message, error type, error code, field errors)
 */
export function createHttpErrorEnvelope(
  statusCode: number,
  ctx: ResponseContext,
  options: HttpErrorEnvelopeOptions,
): HttpErrorEnvelope {
  return {
    success: false,
    statusCode,
    data: null,
    message: options.message ?? null,
    error: options.error ?? 'Error',
    errorCode: options.errorCode ?? null,
    errors: options.errors,
    meta: ctx.meta,
    correlationId: ctx.correlationId,
    timestamp: ctx.timestamp,
  };
}

/**
 * STATUS CODE UTILITY
 *
 * Identifies 204 No Content responses which should return no body.
 */
export function isNoContentStatus(statusCode: number): boolean {
  return statusCode === 204;
}
