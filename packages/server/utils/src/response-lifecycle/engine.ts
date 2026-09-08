/**
 * ============================================================================
 * UNIFIED RESPONSE LIFECYCLE ENGINE
 * ============================================================================
 *
 * This is the CENTRAL ORCHESTRATOR for request → response transformation.
 *
 * Both HTTP interceptor and exception filter use this to ensure:
 *   ✓ Consistent meta/correlation/timestamp handling
 *   ✓ No duplicated context-building logic
 *   ✓ Framework-agnostic response preparation
 *
 * The engine separates concerns:
 *   1. Context preparation (extract from request, build response context)
 *   2. Envelope wrapping (create success/error envelope with context)
 *   3. Data serialization (handle BigInt, Date, circular refs)
 *
 * ARCHITECTURE NOTE:
 * This layer ORCHESTRATES but does NOT duplicate low-level extraction.
 * It uses utility functions from ../request-lifecyle.ts for:
 *   - getCorrelationIdFromHttpRequest() — extract correlation ID from headers
 *   - getCorrelationId() — resolve correlation ID with fallback to context
 * This ensures a single source of truth for all extraction logic.
 */

import type { AppRequest } from '@workspace/types';
import type { ContextPort } from '@workspace/ports';
import { createResponseContext, type ResponseContext } from './context';
import { getCorrelationIdFromHttpRequest, getCorrelationId } from '../request-lifecyle';
import { LifecycleRequestContext } from './core';

/**
 * EXTRACT LIFECYCLE REQUEST CONTEXT
 *
 * Single function to extract all request-level context information.
 * Called ONCE per request by interceptor or filter.
 *
 * Uses existing utility functions from request-lifecyle.ts:
 *   - getCorrelationIdFromHttpRequest() — extract from headers
 *   - getCorrelationId() — resolve with context fallback
 *
 * This ensures we use the SAME correlation ID extraction logic everywhere,
 * eliminating duplication across the codebase.
 *
 * @param req HTTP request object
 * @param contextPort Access to tenant/organization/request context
 * @param buildMeta Custom function to build request metadata
 *
 * @returns All context information needed for response building
 */
export function extractLifecycleRequestContext(
  req: AppRequest,
  contextPort: ContextPort,
  buildMeta: (ctx: ContextPort, req: AppRequest) => Record<string, unknown> | null,
): LifecycleRequestContext {
  //  Extract correlation ID using centralized utility functions
  // First tries x-request-id / x-correlation-id headers,
  // then falls back to context port (set by auth middleware)
  const correlationIdFromRequest = getCorrelationIdFromHttpRequest(req);
  const correlationId = getCorrelationId(contextPort, correlationIdFromRequest);

  return {
    //  Use correlation ID resolved from request + context
    correlationId,

    //  Build request metadata using provided builder function
    // (handles path, method, IP, user agent, tenant, device ID, etc.)
    requestMeta: buildMeta(contextPort, req),
  };
}

/**
 * COMBINE LIFECYCLE METADATA
 *
 * Merges request metadata with response-specific metadata (pagination, etc.).
 * Returns null if both are empty (cleaner responses).
 *
 * @param requestMeta Metadata from the request
 * @param responseMeta Additional metadata from response (pagination, etc.)
 * @returns Combined metadata or null
 */
export function combineLifecycleMetadata(
  requestMeta: Record<string, unknown> | null,
  responseMeta?: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const combined = requestMeta ? { ...requestMeta } : {};

  if (responseMeta) {
    Object.assign(combined, responseMeta);
  }

  return Object.keys(combined).length ? combined : null;
}

/**
 * BUILD RESPONSE CONTEXT FROM REQUEST
 *
 * Central function to create ResponseContext from HTTP request.
 * Eliminates duplication between interceptor and filter.
 *
 * @param lifecycleContext Request context information
 * @param additionalMeta Optional additional metadata to merge
 * @returns Ready-to-use ResponseContext
 *
 * @example
 * // In interceptor:
 * const reqContext = extractLifecycleRequestContext(req, ctx, buildMeta);
 * const paginationMeta = extractPaginationMeta(data);
 * const responseCtx = buildResponseContextFromRequest(reqContext, paginationMeta);
 *
 * // In filter:
 * const reqContext = extractLifecycleRequestContext(req, ctx, buildMeta);
 * const responseCtx = buildResponseContextFromRequest(reqContext);
 */
export function buildResponseContextFromRequest(
  lifecycleContext: LifecycleRequestContext,
  additionalMeta?: Record<string, unknown> | null,
): ResponseContext {
  const meta = combineLifecycleMetadata(lifecycleContext.requestMeta, additionalMeta);

  return createResponseContext({
    correlationId: lifecycleContext.correlationId,
    meta,
  });
}
