import type { DatabaseTx } from '@workspace/ports';
import type { Prisma } from '../../generated/prisma/index.js';
import type { PrismaService } from '../client/prisma.client';

export type PrismaClientLike = PrismaService | Prisma.TransactionClient;

/**
 * Bridges the opaque port-level DatabaseTx (see @workspace/ports' DatabaseTx
 * = unknown) into a concrete Prisma client or transaction client. Every
 * persistence-package adapter/query uses this instead of re-implementing the
 * cast: `resolvePrismaClient(tx, this.prisma).user.findUnique(...)`.
 */
export function resolvePrismaClient(
  tx: DatabaseTx | undefined,
  fallback: PrismaService,
): PrismaClientLike {
  return (tx as Prisma.TransactionClient | undefined) ?? fallback;
}
