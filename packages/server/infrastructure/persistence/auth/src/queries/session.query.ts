import { Inject, Injectable } from '@nestjs/common';
import type { DatabaseTx } from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import type { UserSession as PrismaUserSession } from '@workspace/prisma/client';
import { activeSessionWhere } from '../utils/prisma-where';

// UserSessionRepositoryPort's read methods take no select options — every
// call returns the full row, so no select-projection plumbing is needed here.
//
// NOT RLS-wrapped, deliberately: SELECT on this table is unrestricted (see
// docs/infrastructure/runbooks/db-rls-policies.sql) — findByHash/findByJti
// specifically are used mid-authentication (refresh-token / JWT-jti lookups)
// where the caller does not yet have any resolved identity; a session's
// secret hash/jti is itself the access proof, not something an ownership
// check should gate. RLS still protects UPDATE/DELETE on this table (see the
// adapter) — that's where it adds real value without breaking bootstrap
// reads.
@Injectable()
export class SessionQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById(id: string, tx?: DatabaseTx): Promise<PrismaUserSession | null> {
    return resolvePrismaClient(tx, this.prisma).userSession.findUnique({ where: { id } });
  }

  findByHash(refreshTokenHash: string, tx?: DatabaseTx): Promise<PrismaUserSession | null> {
    return resolvePrismaClient(tx, this.prisma).userSession.findUnique({
      where: { refreshTokenHash },
    });
  }

  findByJti(jti: string, tx?: DatabaseTx): Promise<PrismaUserSession | null> {
    return resolvePrismaClient(tx, this.prisma).userSession.findFirst({ where: { jti } });
  }

  findByDevice(
    userId: string,
    deviceId: string,
    tx?: DatabaseTx,
  ): Promise<PrismaUserSession | null> {
    return resolvePrismaClient(tx, this.prisma).userSession.findUnique({
      where: { userId_deviceId: { userId, deviceId } },
    });
  }

  findActiveSessions(userId: string, tx?: DatabaseTx): Promise<PrismaUserSession[]> {
    return resolvePrismaClient(tx, this.prisma).userSession.findMany({
      where: { userId, ...activeSessionWhere() },
    });
  }
}
