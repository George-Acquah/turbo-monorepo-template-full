/**
 * ============================================================================
 * PURE WEBSOCKET ENVELOPE FACTORY
 * ============================================================================
 *
 * Creates WebSocket error payloads with injected ResponseContext.
 * Follows same pure function pattern as HTTP envelope.
 */

import type { WebSocketErrorPayload, WebSocketErrorPayloadOptions } from '@workspace/types';
import type { ResponseContext } from '../response-lifecycle/context';

/**
 * CREATE WEBSOCKET ERROR PAYLOAD
 *
 * Wraps WebSocket errors in standardized envelope.
 * All metadata comes from injected ResponseContext.
 *
 * @param ctx Pre-built ResponseContext with correlationId, meta, timestamp
 * @param options Error details (message, error type, error code, field errors)
 */
export function createWebSocketErrorPayload(
  ctx: ResponseContext,
  options: WebSocketErrorPayloadOptions,
): WebSocketErrorPayload {
  return {
    success: false,
    message: options.message ?? null,
    error: options.error ?? 'Error',
    errorCode: options.errorCode ?? null,
    errors: options.errors,
    correlationId: ctx.correlationId,
    timestamp: ctx.timestamp,
    meta: ctx.meta,
  };
}
