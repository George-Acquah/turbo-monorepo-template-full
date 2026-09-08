import { Inject, Injectable } from '@nestjs/common';
import type {
  DeadLetterEventPersistence,
  DeadLetterEventPersistenceQueryOptions,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { DeadLetterEvent as PrismaDeadLetterEventModel } from '@workspace/prisma/client';

type DeadLetterEventRow = Partial<PrismaDeadLetterEventModel>;

@Injectable()
export class DeadLetterEventQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof DeadLetterEventPersistence>(
    id: string,
    tx?: unknown,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<DeadLetterEventRow | null> {
    return resolvePrismaClient(tx, this.prisma).deadLetterEvent.findUnique({
      where: { id },
      select: buildPrismaSelect<DeadLetterEventPersistence, K>(options?.select),
    });
  }

  findMany<K extends keyof DeadLetterEventPersistence>(
    params: { status?: DeadLetterEventPersistence['status']; limit?: number; offset?: number },
    tx?: unknown,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<DeadLetterEventRow[]> {
    return resolvePrismaClient(tx, this.prisma).deadLetterEvent.findMany({
      where: { status: params.status },
      orderBy: { createdAt: 'desc' },
      take: params.limit,
      skip: params.offset,
      select: buildPrismaSelect<DeadLetterEventPersistence, K>(options?.select),
    });
  }
}
