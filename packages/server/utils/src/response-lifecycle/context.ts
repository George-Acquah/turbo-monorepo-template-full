/**
 * ============================================================================
 * UNIFIED RESPONSE CONTEXT
 * ============================================================================
 *
 * This is the SINGLE SOURCE OF TRUTH for all response metadata.
 *
 * Every HTTP response, WebSocket message, and RPC call goes through this
 * context builder to ensure consistent handling of:
 *   - correlationId: Request tracking across services
 *   - timestamp: Standardized ISO 8601 timestamp
 *   - meta: Custom metadata (pagination, request info, etc.)
 *
 * This eliminates duplication across interceptors, filters, and lifecycle
 * helpers by centralizing the context creation logic.
 */

/**
 * Core response context structure
 * Immutable after creation to prevent accidental mutations
 */
export interface ResponseContext {
  readonly correlationId: string | null;
  readonly timestamp: string;
  readonly meta: Record<string, unknown> | null;
}

/**
 * Input shape for context builder - allows partial specification
 * Caller can provide only what they need; builder fills in defaults
 */
export interface CreateResponseContextInput {
  correlationId?: string | null;
  meta?: Record<string, unknown> | null;
  timestamp?: string; // Rarely provided; defaults to current ISO time
}

/**
 * UNIFIED CONTEXT BUILDER
 *
 * This is the MISSING PIECE that eliminates duplication.
 *
 * All HTTP responses, WS messages, and RPC calls should use this function
 * to create their context instead of manually building meta/correlationId/timestamp.
 *
 * @example
 * // In interceptor:
 * const ctx = createResponseContext({
 *   correlationId: getCorrelationIdFromRequest(req),
 *   meta: { requestPath: req.path, userId: user.id },
 * });
 *
 * // In exception filter:
 * const ctx = createResponseContext({
 *   correlationId: extractCorrelationIdFromRequest(req),
 *   meta: buildRequestMeta(contextPort, req),
 * });
 *
 * // In lifecycle helpers:
 * const ctx = createResponseContext({ correlationId: userId });
 */
export function createResponseContext(input: CreateResponseContextInput = {}): ResponseContext {
  return {
    correlationId: input.correlationId ?? null,

    timestamp: input.timestamp ?? new Date().toISOString(),

    meta: input.meta && Object.keys(input.meta).length ? input.meta : null,
  };
}
