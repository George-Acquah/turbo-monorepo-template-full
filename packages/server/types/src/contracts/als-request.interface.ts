import { Request } from 'express';
import { UserContext } from './user.interface';
import { WorkspaceEventActor, WorkspaceEventTrace } from '@/events';
import { SystemRoleKey } from '@workspace/constants';

export type RequestTransactionEngine = 'prisma' | 'mongo';

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

  /** Stable client/session identifier for cache and token rotation */
  sessionId?: string;

  /** Active transactions keyed by engine */
  transactions?: Partial<Record<RequestTransactionEngine, unknown>>;

  /** Actor and trace data used when creating events/audit records. */
  actor?: WorkspaceEventActor;
  trace?: WorkspaceEventTrace;

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
}

export interface ContextAuthData {
  iat: number;
  exp: number;
  iss?: string;
  tokenType: 'access' | 'refresh';
}

/**
 * JWT claims extracted from the application auth token.
 */
export interface JwtClaims {
  /** Subject - authenticated user ID */
  sub: string;
  /** Email address */
  email?: string;
  /** Application role */
  role?: SystemRoleKey;
  /** Issued at timestamp */
  iat?: number;
  /** Expiration timestamp */
  exp?: number;
  /** Additional metadata */
  //We will be very strict with the data we store in the JWT claims
}
