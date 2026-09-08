import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  SagaStateRepositoryPort,
  type SagaStatePersistence,
  type CreateSagaStateInput,
  type UpdateSagaStateInput,
  type SagaStatePersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { SagaState as PrismaSagaState } from '@workspace/prisma/client';
import { OutboxConverter } from '../converter/outbox.converter';
import { SagaStateQuery } from '../queries/saga-state.query';

@Injectable()
export class PrismaSagaStateAdapter implements SagaStateRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly sagaStateQuery: SagaStateQuery,
  ) {}

  // (sagaType, correlationId) is the unique key — orchestrator calls this
  // repeatedly across the lifetime of one saga run, so it's an upsert.
  private async upsert<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    data: CreateSagaStateInput,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>> {
    const { id, sagaType, correlationId, completedSteps, failedStep, lastError, completedAt, ...rest } =
      data;
    const row = (await resolvePrismaClient(tx, this.prisma).sagaState.upsert({
      where: { sagaType_correlationId: { sagaType, correlationId } },
      create: {
        id: id ?? generateId(IdPrefixes.SAGA),
        sagaType,
        correlationId,
        ...rest,
        completedSteps: completedSteps ?? [],
        failedStep: failedStep ?? undefined,
        lastError: lastError ?? undefined,
        completedAt: completedAt ?? undefined,
      },
      update: {
        ...rest,
        completedSteps: completedSteps ?? undefined,
        failedStep: failedStep ?? undefined,
        lastError: lastError ?? undefined,
        completedAt: completedAt ?? undefined,
      },
      select: buildPrismaSelect<SagaStatePersistence, K>(options?.select),
    })) as Partial<PrismaSagaState>;
    return OutboxConverter.toSagaStatePartialPersistence(row) as Pick<SagaStatePersistence, K>;
  }

  async saveTx<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    tx: DatabaseTx,
    data: CreateSagaStateInput,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>> {
    return this.upsert(data, tx, options);
  }

  async saveLifecycle(state: CreateSagaStateInput): Promise<void> {
    await this.upsert(state);
  }

  async findById<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    sagaId: string,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K> | null> {
    const row = await this.sagaStateQuery.findById(sagaId, tx, options);
    return row
      ? (OutboxConverter.toSagaStatePartialPersistence(row) as Pick<SagaStatePersistence, K>)
      : null;
  }

  async findByCorrelationId<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    correlationId: string,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K> | null> {
    const row = await this.sagaStateQuery.findByCorrelationId(correlationId, tx, options);
    return row
      ? (OutboxConverter.toSagaStatePartialPersistence(row) as Pick<SagaStatePersistence, K>)
      : null;
  }

  async findByType<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    sagaType: string,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>[]> {
    const rows = await this.sagaStateQuery.findByType(sagaType, options);
    return rows.map(
      (row) => OutboxConverter.toSagaStatePartialPersistence(row) as Pick<SagaStatePersistence, K>,
    );
  }

  async update<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    id: string,
    data: UpdateSagaStateInput,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>> {
    const row = (await resolvePrismaClient(tx, this.prisma).sagaState.update({
      where: { id },
      data,
      select: buildPrismaSelect<SagaStatePersistence, K>(options?.select),
    })) as Partial<PrismaSagaState>;
    return OutboxConverter.toSagaStatePartialPersistence(row) as Pick<SagaStatePersistence, K>;
  }

  async updateCompensatingByCorrelationId<
    K extends keyof SagaStatePersistence = keyof SagaStatePersistence,
  >(
    correlationId: string,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>> {
    const row = (await resolvePrismaClient(tx, this.prisma).sagaState.update({
      where: { id: (await this.requireIdByCorrelationId(correlationId, tx)) },
      data: { status: 'COMPENSATING' },
      select: buildPrismaSelect<SagaStatePersistence, K>(options?.select),
    })) as Partial<PrismaSagaState>;
    return OutboxConverter.toSagaStatePartialPersistence(row) as Pick<SagaStatePersistence, K>;
  }

  async updateCompensatedByCorrelationId<
    K extends keyof SagaStatePersistence = keyof SagaStatePersistence,
  >(
    correlationId: string,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>> {
    const row = (await resolvePrismaClient(tx, this.prisma).sagaState.update({
      where: { id: (await this.requireIdByCorrelationId(correlationId, tx)) },
      data: { status: 'COMPENSATED', completedAt: new Date() },
      select: buildPrismaSelect<SagaStatePersistence, K>(options?.select),
    })) as Partial<PrismaSagaState>;
    return OutboxConverter.toSagaStatePartialPersistence(row) as Pick<SagaStatePersistence, K>;
  }

  async findTimedOutSagas<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    batchSize: number,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>[]> {
    const rows = await this.sagaStateQuery.findTimedOutSagas(batchSize, tx, options);
    return rows.map(
      (row) => OutboxConverter.toSagaStatePartialPersistence(row) as Pick<SagaStatePersistence, K>,
    );
  }

  async deleteCompletedSagas(batchSize: number, tx?: DatabaseTx): Promise<number> {
    const client = resolvePrismaClient(tx, this.prisma);
    const targets = await client.sagaState.findMany({
      where: { status: 'COMPLETED' },
      take: batchSize,
      select: { id: true },
    });
    const result = await client.sagaState.deleteMany({
      where: { id: { in: targets.map((row: { id: string }) => row.id) } },
    });
    return result.count;
  }

  async deleteOldSagas(batchSize: number, retentionDays: number, tx?: DatabaseTx): Promise<number> {
    const client = resolvePrismaClient(tx, this.prisma);
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const targets = await client.sagaState.findMany({
      where: { createdAt: { lt: cutoff } },
      take: batchSize,
      select: { id: true },
    });
    const result = await client.sagaState.deleteMany({
      where: { id: { in: targets.map((row: { id: string }) => row.id) } },
    });
    return result.count;
  }

  private async requireIdByCorrelationId(correlationId: string, tx?: DatabaseTx): Promise<string> {
    const row = await resolvePrismaClient(tx, this.prisma).sagaState.findFirstOrThrow({
      where: { correlationId },
      select: { id: true },
    });
    return row.id;
  }
}
