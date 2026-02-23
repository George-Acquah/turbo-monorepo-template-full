import { Request } from 'express';
import { UserContext } from './user.interface';

/**
 * AppContext (RequestContext) - Per-request context stored in AsyncLocalStorage.
 *
 * Provides a single, efficient per-request app context accessible application-wide
 * without needing controller decorators for request values.
 *
 * Set by middleware at the start of each request and accessible via:
 * - AsyncContextService (DI)
 * - globalRequestContext.getStore() (non-DI code)
 */
export interface RequestContext {
  /** Unique request identifier for tracing/correlation */
  requestId: string;

  /** Metadata about the authentication event */
  authMetadata?: ContextAuthData;

  /** Authenticated user context (populated after auth guard) */
  user?: UserContext;

  /** Raw refresh token if present (for token refresh flows) */
  rawRefreshToken?: string;

  /** Active Prisma transaction for request-scoped transactions */
  prismaTransaction?: unknown;

  /** Client device identifier for device-specific operations */
  deviceId?: string;

  // ─── HTTP Request Metadata ───────────────────────────────────────
  /** HTTP method (GET, POST, etc.) */
  method: string;

  /** Request path */
  path: string;

  /** Client IP address */
  ip?: string;

  /** User agent string */
  userAgent?: string;

  /**
   * Lazy accessor for the raw Express request.
   * Not set by default unless you choose to.
   */ getRequest?: () => Request;

  /** Request start timestamp for performance tracking */
  startTime: number;

  txClient?: unknown;
}

export interface ContextAuthData {
  iat: number;
  exp: number;
  iss?: string;
  tokenType: 'access' | 'refresh';
}

/**
 * JWT claims extracted from Supabase token
 */
export interface JwtClaims {
  /** Subject - Supabase user ID */
  sub: string;
  /** Email address */
  email?: string;
  /** Supabase/App role */
  role?: string;
  /** Issued at timestamp */
  iat?: number;
  /** Expiration timestamp */
  exp?: number;
  /** Additional metadata */
  [key: string]: unknown;
}
