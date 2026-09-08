import { serializeForTransport } from '../transport/serialize';

export function toTransport<T>(data: T): ReturnType<typeof serializeForTransport<T>> {
  return serializeForTransport(data);
}

/**
 * LIFECYCLE REQUEST CONTEXT
 *
 * Extracted metadata from the HTTP request.
 * This is what we extract ONCE and reuse for context building.
 */
export interface LifecycleRequestContext {
  // Correlation tracking
  correlationId: string | null;

  // Request metadata (path, method, userId, tenantId, etc.)
  requestMeta: Record<string, unknown> | null;

  // Additional response metadata (pagination, etc.)
  responseMeta?: Record<string, unknown> | null;
}
