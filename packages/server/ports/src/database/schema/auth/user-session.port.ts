import { DatabaseTx } from '../shared';
import {
  UserSessionPersistence,
  CreateUserSessionInput,
  UpdateUserSessionInput,
} from './auth.types';

export abstract class UserSessionRepositoryPort {
  /**
   * @param userId explicit RLS override — pass the resolved user id when
   *   this is called with no `tx` and no request-scoped `getCurrentUser()`
   *   context yet (e.g. `SessionIssuerService.issue()`, which runs before any
   *   JWT/RequestContext exists — see `docs/infrastructure/runbooks/
   *   db-rls-policies.sql`'s v5 entry). Ignored when `tx` is provided; the
   *   enclosing `transactionPort.execute(...)` call already set the RLS
   *   context for the whole transaction in that case.
   */
  abstract create(
    data: CreateUserSessionInput,
    tx?: DatabaseTx,
    userId?: string | null,
  ): Promise<UserSessionPersistence>;

  abstract findById(id: string, tx?: DatabaseTx): Promise<UserSessionPersistence | null>;

  abstract findByHash(hash: string, tx?: DatabaseTx): Promise<UserSessionPersistence | null>;

  /**
   * Finds a session by its unique JWT ID (JTI) for revocation checks.
   */
  abstract findByJti(jti: string, tx?: DatabaseTx): Promise<UserSessionPersistence | null>;

  /**
   * Finds a session associated with a specific device for a user.
   */
  abstract findByDevice(
    userId: string,
    deviceId: string,
    tx?: DatabaseTx,
  ): Promise<UserSessionPersistence | null>;

  /**
   * Retrieves all active (non-revoked, non-expired) sessions for a user.
   */
  abstract findActiveSessions(userId: string, tx?: DatabaseTx): Promise<UserSessionPersistence[]>;

  /**
   * @param userId explicit RLS override — see `create()`'s doc comment.
   */
  abstract update(
    id: string,
    data: UpdateUserSessionInput,
    tx?: DatabaseTx,
    userId?: string | null,
  ): Promise<UserSessionPersistence>;

  /**
   * Marks a specific session as revoked.
   */
  abstract revokeSession(id: string, tx?: DatabaseTx): Promise<void>;

  /**
   * Marks a specific session as revoked using the jti.
   *
   * @param userId explicit RLS override — see `create()`'s doc comment.
   *   Used by `RefreshTokenUseCase`, which already has the resolved user id
   *   locally and calls this with no `tx`.
   */
  abstract revokeSessionByJti(jti: string, tx?: DatabaseTx, userId?: string | null): Promise<void>;

  /**
   * Revokes all active sessions for a user (e.g., during a password reset or security breach).
   */
  abstract revokeAllForUser(
    userId: string,
    exceptSessionId?: string,
    tx?: DatabaseTx,
  ): Promise<void>;

  /**
   * Cleans up expired and revoked sessions to save space.
   */
  abstract pruneExpiredSessions(tx?: DatabaseTx): Promise<number>;
}

export const USER_SESSION_REPOSITORY_TOKEN = Symbol('USER_SESSION_REPOSITORY_TOKEN');
export const PRISMA_USER_SESSION_REPOSITORY_TOKEN = Symbol('PRISMA_USER_SESSION_REPOSITORY_TOKEN');
