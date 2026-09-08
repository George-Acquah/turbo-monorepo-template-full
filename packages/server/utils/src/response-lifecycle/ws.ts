/**
 * ============================================================================
 * WEBSOCKET RESPONSE LIFECYCLE
 * ============================================================================
 *
 * This layer orchestrates WebSocket error responses.
 * Uses the same context builder pattern as HTTP for consistency.
 */

import type { WebSocketErrorPayloadOptions } from '@workspace/types';
import { createWebSocketErrorPayload } from '../websocket/envelope';
import { createResponseContext, type CreateResponseContextInput } from './context';
import { toTransport } from './core';

/**
 * WEBSOCKET ERROR RESPONSE
 *
 * Standardized way to return WebSocket errors.
 * Uses identical context-building pattern as HTTP responses.
 *
 * @param options.correlationId Connection correlation ID
 * @param options.meta Custom metadata (user info, connection details, etc.)
 * @param options.message Human-readable error message
 * @param options.error Error type/category
 * @param options.errorCode Machine-readable error code
 * @param options.errors Field-level or detailed errors
 *
 * @example
 * return wsError({
 *   correlationId: connectionContext.correlationId,
 *   message: 'Invalid message format',
 *   error: 'INVALID_MESSAGE',
 *   meta: { userId: user.id, roomId: room.id },
 * });
 */
export function wsError(options: WebSocketErrorPayloadOptions & CreateResponseContextInput) {
  const { correlationId, meta: rawMeta, timestamp, ...payloadOptions } = options;

  const ctx = createResponseContext({
    correlationId,
    meta: rawMeta ? toTransport(rawMeta) : null,
    timestamp,
  });

  return createWebSocketErrorPayload(ctx, payloadOptions);
}
