import type { ContextPort } from '@workspace/ports';
import type { LifecycleRequestContext } from './core';

// Ensure getCorrelationId is imported from wherever your core utils live
import { getCorrelationId } from '../request-lifecyle';

export type WebSocketClient = {
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

/**
 * Extracts correlation ID specifically from a WebSocket handshake.
 * Checks headers first, then falls back to query parameters.
 */
export function getCorrelationIdFromWs(client: WebSocketClient): string | null {
  const headers = client.handshake?.headers || {};
  const query = client.handshake?.query || {};

  return (
    (headers['x-correlation-id'] as string) ||
    (headers['x-request-id'] as string) ||
    (query['correlationId'] as string) ||
    null
  );
}

/**
 * EXTRACT WS LIFECYCLE REQUEST CONTEXT
 *
 * The WebSocket equivalent of extractLifecycleRequestContext.
 * Reads metadata and correlation IDs from the socket handshake instead of an HTTP Request.
 */
export function extractWsLifecycleRequestContext(
  client: WebSocketClient,
  contextPort: ContextPort,
  buildMeta: (ctx: ContextPort, client: WebSocketClient) => Record<string, unknown> | null,
): LifecycleRequestContext {
  // Extract from socket handshake, then resolve via context fallback
  const correlationIdFromClient = getCorrelationIdFromWs(client);
  const correlationId = getCorrelationId(contextPort, correlationIdFromClient);

  return {
    correlationId,
    requestMeta: buildMeta(contextPort, client),
  };
}
