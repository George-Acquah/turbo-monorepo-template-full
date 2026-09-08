import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  OutboxEventRepositoryPort,
  type OutboxEventPersistence,
  type CreateOutboxEventInput,
  type OutboxEventPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { OutboxEvent as PrismaOutboxEvent } from '@workspace/prisma/client';
import { OutboxConverter } from '../converter/outbox.converter';
import { OutboxEventQuery } from '../queries/outbox-event.query';

@Injectable()
export class PrismaOutboxEventAdapter implements OutboxEventRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly outboxEventQuery: OutboxEventQuery,
  ) {}

  async enqueueTx<K extends keyof OutboxEventPersistence = keyof OutboxEventPersistence>(
    event: CreateOutboxEventInput,
    tx?: DatabaseTx,
    options?: OutboxEventPersistenceQueryOptions<K>,
  ): Promise<Pick<OutboxEventPersistence, K>> {
    const { id, payload, metadata, ...rest } = event;
    const row = (await resolvePrismaClient(tx, this.prisma).outboxEvent.create({
      data: {
        id: id ?? generateId(IdPrefixes.OUTBOX_EVENT),
        ...rest,
        payload: payload as object,
        metadata: (metadata as object | null) ?? undefined,
      },
      select: buildPrismaSelect<OutboxEventPersistence, K>(options?.select),
    })) as Partial<PrismaOutboxEvent>;
    return OutboxConverter.toOutboxEventPartialPersistence(row) as Pick<OutboxEventPersistence, K>;
  }

  async claimPendingEvents(
    batchSize: number,
    tx?: DatabaseTx,
  ): Promise<OutboxEventPersistence[]> {
    const rows = await this.outboxEventQuery.claimPendingEvents(batchSize, tx);
    return rows.map(
      (row) => OutboxConverter.toOutboxEventPartialPersistence(row) as OutboxEventPersistence,
    );
  }

  async reclaimStuckProcessing(stuckBefore: Date, tx?: DatabaseTx): Promise<number> {
    return this.outboxEventQuery.reclaimStuckProcessing(stuckBefore, tx);
  }

  async markProcessed<K extends keyof OutboxEventPersistence = keyof OutboxEventPersistence>(
    id: string,
    tx?: DatabaseTx,
    options?: OutboxEventPersistenceQueryOptions<K>,
  ): Promise<Pick<OutboxEventPersistence, K>> {
    const row = (await resolvePrismaClient(tx, this.prisma).outboxEvent.update({
      where: { id },
      data: { status: 'PROCESSED', publishedAt: new Date() },
      select: buildPrismaSelect<OutboxEventPersistence, K>(options?.select),
    })) as Partial<PrismaOutboxEvent>;
    return OutboxConverter.toOutboxEventPartialPersistence(row) as Pick<OutboxEventPersistence, K>;
  }

  /**
   * `retryAt` is the explicit third parameter. It used to be smuggled through
   * the `tx` slot and recovered with `tx instanceof Date` — which type-checked
   * only because `DatabaseTx` is `unknown`, and would have silently dropped
   * either the retry schedule or the transaction the moment a caller passed
   * both.
   */
  async markFailed<K extends keyof OutboxEventPersistence = keyof OutboxEventPersistence>(
    id: string,
    errorMessage: string,
    retryAt?: Date | null,
    tx?: DatabaseTx,
    options?: OutboxEventPersistenceQueryOptions<K>,
  ): Promise<Pick<OutboxEventPersistence, K>> {
    const row = (await resolvePrismaClient(tx, this.prisma).outboxEvent.update({
      where: { id },
      data: {
        status: retryAt ? 'FAILED' : 'DEAD_LETTERED',
        lastError: errorMessage,
        lastAttemptAt: new Date(),
        attempts: { increment: 1 },
        nextRetryAt: retryAt ?? null,
      },
      select: buildPrismaSelect<OutboxEventPersistence, K>(options?.select),
    })) as Partial<PrismaOutboxEvent>;
    return OutboxConverter.toOutboxEventPartialPersistence(row) as Pick<OutboxEventPersistence, K>;
  }

  async pruneProcessedEvents(olderThan: Date, tx?: DatabaseTx): Promise<number> {
    const result = await resolvePrismaClient(tx, this.prisma).outboxEvent.deleteMany({
      where: { status: 'PROCESSED', publishedAt: { lt: olderThan } },
    });
    return result.count;
  }
}
