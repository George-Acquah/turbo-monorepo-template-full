import type { ContextPort, DatabaseTx } from '@repo/ports';
import type { Prisma } from '../../generated/prisma/client';
import type { PrismaDbClient, PrismaService } from '../prisma.service';

export type PrismaExecutionClient = Prisma.TransactionClient | PrismaDbClient;

export function resolvePrismaClient(
  prisma: PrismaService,
  context?: ContextPort | null,
  tx?: DatabaseTx,
): PrismaExecutionClient {
  if (tx) {
    return tx as Prisma.TransactionClient;
  }

  if (context?.isInContext()) {
    try {
      const contextualTx = context.getTransaction<Prisma.TransactionClient>('prisma');
      if (contextualTx) {
        return contextualTx;
      }
    } catch {
      // Fall through to the root Prisma client when no contextual tx is available.
    }
  }

  return prisma.db;
}
