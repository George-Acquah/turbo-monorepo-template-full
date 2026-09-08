import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  UserSessionRepositoryPort,
  type UserSessionPersistence,
  type CreateUserSessionInput,
  type UpdateUserSessionInput,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, withRlsAwareClient } from '@workspace/prisma';
import { SessionQuery } from '../queries/session.query';

@Injectable()
export class PrismaUserSessionAdapter implements UserSessionRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly sessionQuery: SessionQuery,
  ) {}

  // RLS-protected table (docs/infrastructure/runbooks/db-rls-policies.sql) —
  // withRlsAwareClient sets app.user_id/app.user_role for bare (no-tx) calls;
  // an already-open tx already had it set once by PrismaTransactionAdapter.
  // `userId` is an explicit override for bare calls made before any
  // JWT/RequestContext exists (e.g. SessionIssuerService.issue()).
  async create(
    data: CreateUserSessionInput,
    tx?: DatabaseTx,
    userId?: string | null,
  ): Promise<UserSessionPersistence> {
    const { id, ...rest } = data;
    return withRlsAwareClient(
      tx,
      this.prisma,
      (client) =>
        client.userSession.create({
          data: { id: id ?? generateId(IdPrefixes.USER_SESSION), ...rest },
        }),
      { userId },
    );
  }

  findById(id: string, tx?: DatabaseTx): Promise<UserSessionPersistence | null> {
    return this.sessionQuery.findById(id, tx);
  }

  findByHash(hash: string, tx?: DatabaseTx): Promise<UserSessionPersistence | null> {
    return this.sessionQuery.findByHash(hash, tx);
  }

  findByJti(jti: string, tx?: DatabaseTx): Promise<UserSessionPersistence | null> {
    return this.sessionQuery.findByJti(jti, tx);
  }

  findByDevice(
    userId: string,
    deviceId: string,
    tx?: DatabaseTx,
  ): Promise<UserSessionPersistence | null> {
    return this.sessionQuery.findByDevice(userId, deviceId, tx);
  }

  findActiveSessions(userId: string, tx?: DatabaseTx): Promise<UserSessionPersistence[]> {
    return this.sessionQuery.findActiveSessions(userId, tx);
  }

  update(
    id: string,
    data: UpdateUserSessionInput,
    tx?: DatabaseTx,
    userId?: string | null,
  ): Promise<UserSessionPersistence> {
    return withRlsAwareClient(
      tx,
      this.prisma,
      (client) => client.userSession.update({ where: { id }, data }),
      { userId },
    );
  }

  async revokeSession(id: string, tx?: DatabaseTx): Promise<void> {
    await withRlsAwareClient(tx, this.prisma, (client) =>
      client.userSession.update({
        where: { id },
        data: { revokedAt: new Date() },
      }),
    );
  }

  async revokeSessionByJti(jti: string, tx?: DatabaseTx, userId?: string | null): Promise<void> {
    await withRlsAwareClient(
      tx,
      this.prisma,
      (client) =>
        client.userSession.updateMany({
          where: { jti },
          data: { revokedAt: new Date() },
        }),
      { userId },
    );
  }

  async revokeAllForUser(
    userId: string,
    exceptSessionId?: string,
    tx?: DatabaseTx,
  ): Promise<void> {
    await withRlsAwareClient(tx, this.prisma, (client) =>
      client.userSession.updateMany({
        where: {
          userId,
          revokedAt: null,
          ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
        },
        data: { revokedAt: new Date() },
      }),
    );
  }

  // Unscoped multi-user sweep — no caller found yet (grepped modules/,
  // possibly not wired in like apps/worker/CLAUDE.md's SagaCleanupService).
  // Whoever calls this needs to run as workspace_worker or a staff role for
  // the RLS DELETE policy's bypass to apply — there's no per-row owner
  // filter here for it to match otherwise. Under RLS with no bypass, this
  // silently deletes 0 rows rather than failing loudly — safe, but worth
  // confirming the eventual caller's role before relying on it actually
  // pruning anything.
  async pruneExpiredSessions(tx?: DatabaseTx): Promise<number> {
    const result = await withRlsAwareClient<{ count: number }>(tx, this.prisma, (client) =>
      client.userSession.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
        },
      }),
    );
    return result.count;
  }
}
