// application/ports/context.port.ts

import { AppRequest, ContextAuthData, UserContext } from '@repo/types';

export type TransactionEngine = 'prisma' | 'mongo';

export abstract class ContextPort {
  /**
   * Retrieves the current authenticated user.
   */
  abstract getUser(): UserContext | undefined;

  abstract setUser(user: UserContext): boolean;

  abstract setAuthMetadata(authMetadata: ContextAuthData): boolean;
  abstract getAuthMetadata(): ContextAuthData | undefined;

  abstract setRawRefreshToken(rawRefreshToken: string): boolean;

  /**
   * Retrieves the current User ID.
   * Implementation should throw an error if not authenticated.
   */
  abstract getUserId(): string;

  /**
   * Get the current user's ID, or undefined if not authenticated.
   */
  abstract getUserIdOptional(): string | undefined;

  /**
   * Retrieves the correlation/request ID for tracing.
   */
  abstract getRequestId(): string;

  /**
   * Get the current user's ID, or undefined if not authenticated.
   */
  abstract getMethod(): string | undefined;

  /**
   * Get the unique request ID for correlation/tracing.
   */
  abstract getUserAgent(): string;

  /**
   * Get the device ID header value.
   */
  abstract getDeviceId(): string | undefined;

  abstract getRequest(): AppRequest | undefined;

  /**
   * Get the client IP address.
   */
  abstract getIp(): string | undefined;

  abstract getRoutePath(): string | undefined;

  abstract setTransaction(engine: TransactionEngine, tx: unknown): boolean;
  abstract getTransaction<T = unknown>(engine: TransactionEngine): T | undefined;
  abstract clearTransaction(engine: TransactionEngine): boolean;

  /**
   * Checks if the execution is currently within a valid request context.
   */
  abstract isInContext(): boolean;
}

/**
 * Injection token for the Context Port
 */
export const CONTEXT_TOKEN = Symbol('CONTEXT_TOKEN');
