// application/ports/context.port.ts

import { AppRequest, ContextAuthData, WorkspaceEventActor, WorkspaceEventTrace, UserContext } from '@workspace/types';

export type TransactionEngine = 'prisma' | 'mongo';

export abstract class ContextPort {
  /* ===========================================================================
   * 1. CORE CONTEXT & LIFECYCLE
   * Methods related to the fundamental execution context and raw request.
   * ======================================================================== */

  /**
   * Checks if the execution is currently within a valid request context.
   */
  abstract isInContext(): boolean;

  abstract getRequest(): AppRequest | undefined;

  /* ===========================================================================
   * 2. AUTHENTICATION & USER IDENTITY
   * Methods related to the current user, session, and authentication state.
   * ======================================================================== */

  /**
   * Retrieves the current authenticated user.
   */
  abstract getUser(): UserContext | undefined;
  abstract setUser(user: UserContext): boolean;

  /**
   * Retrieves the current User ID.
   * Implementation should throw an error if not authenticated.
   */
  abstract getUserId(): string;

  /**
   * Get the current user's ID, or undefined if not authenticated.
   */
  abstract getUserIdOptional(): string | undefined;

  abstract setAuthMetadata(authMetadata: ContextAuthData): boolean;
  abstract getAuthMetadata(): ContextAuthData | undefined;

  abstract setRawRefreshToken(rawRefreshToken: string): boolean;
  abstract getRawRefreshToken(): string | undefined;

  abstract setSessionId(sessionId: string): boolean;
  abstract getSessionIdOptional(): string | undefined;

  abstract getActor(): WorkspaceEventActor;
  abstract setActor(actor: WorkspaceEventActor): boolean;

  /**
   * Check if the current user is a SUPER_ADMIN.
   */
  abstract isSuperAdmin(): boolean;

  /* ===========================================================================
   * 3. NETWORK, TRACING & DEVICE
   * Methods related to HTTP details, client tracking, and request correlation.
   * ======================================================================== */

  /**
   * Retrieves the correlation/request ID for tracing.
   */
  abstract getRequestId(): string;

  /**
   * Get the unique request ID for correlation/tracing.
   */
  abstract getUserAgent(): string;

  /**
   * Get the current user's ID, or undefined if not authenticated.
   */
  abstract getMethod(): string | undefined;

  /**
   * Get the device ID header value.
   */
  abstract getDeviceId(): string | undefined;
  abstract setDeviceId(deviceId: string): boolean;

  /**
   * Get the client IP address.
   */
  abstract getIp(): string | undefined;

  abstract getRoutePath(): string | undefined;

  abstract getTrace(): WorkspaceEventTrace;
  abstract setTrace(trace: WorkspaceEventTrace): boolean;

  /* ===========================================================================
   * 4. DATA & TRANSACTION MANAGEMENT
   * Methods related to database transactions.
   * ======================================================================== */

  abstract setTransaction(engine: TransactionEngine, tx: unknown): boolean;
  abstract getTransaction<T = unknown>(engine: TransactionEngine): T | undefined;
  abstract clearTransaction(engine: TransactionEngine): boolean;
}

/**
 * Injection token for the Context Port
 */
export const CONTEXT_TOKEN = Symbol('CONTEXT_TOKEN');
