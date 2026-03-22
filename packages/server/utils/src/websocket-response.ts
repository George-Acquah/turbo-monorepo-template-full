import type { WebSocketErrorPayload, WebSocketErrorPayloadOptions } from '@repo/types';

export function createWebSocketErrorPayload(
  options: WebSocketErrorPayloadOptions,
): WebSocketErrorPayload {
  return {
    success: false,
    message: options.message ?? null,
    error: options.error ?? 'Error',
    errorCode: options.errorCode ?? null,
    errors: options.errors,
    correlationId: options.correlationId ?? null,
    timestamp: options.timestamp ?? new Date().toISOString(),
    meta: options.meta ?? null,
  };
}
