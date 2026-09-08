/**
 * ============================================================================
 * HTTP RESPONSE LIFECYCLE
 * ============================================================================
 *
 * This layer is the ORCHESTRATOR for HTTP responses.
 * It coordinates:
 *   1. Context creation (correlationId, meta, timestamp)
 *   2. Data serialization (BigInt, Date, etc.)
 *   3. Envelope wrapping (success/error)
 *
 * This is what use cases call instead of manually building envelopes.
 */

import type { HttpErrorEnvelopeOptions, HttpSuccessEnvelopeOptions } from '@workspace/types';
import { createHttpSuccessEnvelope, createHttpErrorEnvelope } from '../http/envelope';
import { createResponseContext, type CreateResponseContextInput } from './context';
import { toTransport } from './core';

/**
 * HTTP SUCCESS RESPONSE
 *
 * Standardized way to return successful HTTP responses from use cases.
 *
 * @param statusCode HTTP status code (200, 201, etc.)
 * @param data Response payload
 * @param options.correlationId Request correlation ID (for tracking)
 * @param options.meta Custom metadata (pagination, etc.)
 * @param options.message Human-readable success message
 *
 * @example
 * return httpOk(200, { id: user.id, email: user.email }, {
 *   correlationId: requestContext.correlationId,
 *   message: 'User created successfully',
 * });
 */
export function httpOk<T>(
  statusCode: number,
  data: T,
  options: HttpSuccessEnvelopeOptions & CreateResponseContextInput = {},
) {
  const { correlationId, meta, message, timestamp } = options;

  const ctx = createResponseContext({
    correlationId,
    meta,
    timestamp,
  });

  const serializedData = toTransport(data);

  return createHttpSuccessEnvelope(statusCode, serializedData, ctx, { message });
}

/**
 * HTTP ERROR RESPONSE
 *
 * Standardized way to return error HTTP responses from use cases.
 *
 * @param statusCode HTTP error status code (400, 404, 500, etc.)
 * @param options.correlationId Request correlation ID
 * @param options.meta Custom error metadata
 * @param options.message Human-readable error message
 * @param options.error Error type/category
 * @param options.errorCode Machine-readable error code
 * @param options.errors Field-level validation errors
 *
 * @example
 * return httpError(400, {
 *   correlationId: requestContext.correlationId,
 *   message: 'Validation failed',
 *   error: 'VALIDATION_ERROR',
 *   errorCode: 'VAL001',
 *   errors: [{ field: 'email', message: 'Invalid email' }],
 * });
 */
export function httpError(
  statusCode: number,
  options: HttpErrorEnvelopeOptions & CreateResponseContextInput,
) {
  const { correlationId, meta, timestamp, ...envelopeOptions } = options;

  const ctx = createResponseContext({
    correlationId,
    meta,
    timestamp,
  });

  return createHttpErrorEnvelope(statusCode, ctx, envelopeOptions);
}
