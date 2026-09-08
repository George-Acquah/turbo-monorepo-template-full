import { Inject, Injectable } from '@nestjs/common';
import type { SagaStatePersistence, SagaStatePersistenceQueryOptions } from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { SagaState as PrismaSagaStateModel } from '@workspace/prisma/client';

type SagaStateRow = Partial<PrismaSagaStateModel>;

@Injectable()
export class SagaStateQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof SagaStatePersistence>(
    id: string,
    tx?: unknown,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<SagaStateRow | null> {
    return resolvePrismaClient(tx, this.prisma).sagaState.findUnique({
      where: { id },
      select: buildPrismaSelect<SagaStatePersistence, K>(options?.select),
    });
  }

  findByCorrelationId<K extends keyof SagaStatePersistence>(
    correlationId: string,
    tx?: unknown,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<SagaStateRow | null> {
    return resolvePrismaClient(tx, this.prisma).sagaState.findFirst({
      where: { correlationId },
      select: buildPrismaSelect<SagaStatePersistence, K>(options?.select),
    });
  }

  findByType<K extends keyof SagaStatePersistence>(
    sagaType: string,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<SagaStateRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).sagaState.findMany({
      where: { sagaType },
      select: buildPrismaSelect<SagaStatePersistence, K>(options?.select),
    });
  }

  findTimedOutSagas<K extends keyof SagaStatePersistence>(
    batchSize: number,
    tx?: unknown,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<SagaStateRow[]> {
    return resolvePrismaClient(tx, this.prisma).sagaState.findMany({
      where: { status: 'IN_PROGRESS', timeoutAt: { lte: new Date() } },
      take: batchSize,
      select: buildPrismaSelect<SagaStatePersistence, K>(options?.select),
    });
  }
}
