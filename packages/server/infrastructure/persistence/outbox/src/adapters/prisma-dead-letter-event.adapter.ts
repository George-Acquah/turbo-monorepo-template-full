import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  DeadLetterEventRepositoryPort,
  type DeadLetterEventPersistence,
  type CreateDeadLetterEventInput,
  type UpdateDeadLetterEventInput,
  type DeadLetterEventPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { DeadLetterEvent as PrismaDeadLetterEvent } from '@workspace/prisma/client';
import { OutboxConverter } from '../converter/outbox.converter';
import { DeadLetterEventQuery } from '../queries/dead-letter-event.query';

@Injectable()
export class PrismaDeadLetterEventAdapter implements DeadLetterEventRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly dlqQuery: DeadLetterEventQuery,
  ) {}

  async create<K extends keyof DeadLetterEventPersistence = keyof DeadLetterEventPersistence>(
    data: CreateDeadLetterEventInput,
    tx?: DatabaseTx,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<Pick<DeadLetterEventPersistence, K>> {
    const { id, payload, ...rest } = data;
    const row = (await resolvePrismaClient(tx, this.prisma).deadLetterEvent.create({
      data: { id: id ?? generateId(IdPrefixes.DEAD_LETTER_EVENT), ...rest, payload: payload as object },
      select: buildPrismaSelect<DeadLetterEventPersistence, K>(options?.select),
    })) as Partial<PrismaDeadLetterEvent>;
    return OutboxConverter.toDeadLetterEventPartialPersistence(row) as Pick<
      DeadLetterEventPersistence,
      K
    >;
  }

  async findById<K extends keyof DeadLetterEventPersistence = keyof DeadLetterEventPersistence>(
    dlqEventId: string,
    tx?: DatabaseTx,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<Pick<DeadLetterEventPersistence, K> | null> {
    const row = await this.dlqQuery.findById(dlqEventId, tx, options);
    return row
      ? (OutboxConverter.toDeadLetterEventPartialPersistence(row) as Pick<
          DeadLetterEventPersistence,
          K
        >)
      : null;
  }

  async findMany<K extends keyof DeadLetterEventPersistence = keyof DeadLetterEventPersistence>(
    params: {
      tenantId?: string | null;
      status?: DeadLetterEventPersistence['status'];
      limit?: number;
      offset?: number;
    },
    tx?: DatabaseTx,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<Pick<DeadLetterEventPersistence, K>[]> {
    // params.tenantId is a legacy multi-tenant leftover — this schema is
    // single-tenant (doc header) and DeadLetterEvent has no tenantId column.
    const rows = await this.dlqQuery.findMany(params, tx, options);
    return rows.map(
      (row) =>
        OutboxConverter.toDeadLetterEventPartialPersistence(row) as Pick<
          DeadLetterEventPersistence,
          K
        >,
    );
  }

  async resolveDLQEvent<
    K extends keyof DeadLetterEventPersistence = keyof DeadLetterEventPersistence,
  >(
    dlqEventId: string,
    data: Omit<UpdateDeadLetterEventInput, 'status' | 'nextRetryAt'>,
    tx?: DatabaseTx,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<Pick<DeadLetterEventPersistence, K>> {
    const row = (await resolvePrismaClient(tx, this.prisma).deadLetterEvent.update({
      where: { id: dlqEventId },
      data: { ...data, status: 'RESOLVED', resolvedAt: data.resolvedAt ?? new Date() },
      select: buildPrismaSelect<DeadLetterEventPersistence, K>(options?.select),
    })) as Partial<PrismaDeadLetterEvent>;
    return OutboxConverter.toDeadLetterEventPartialPersistence(row) as Pick<
      DeadLetterEventPersistence,
      K
    >;
  }

  async retryDLQEvent<
    K extends keyof DeadLetterEventPersistence = keyof DeadLetterEventPersistence,
  >(
    dlqEventId: string,
    data: Omit<UpdateDeadLetterEventInput, 'status'>,
    tx?: DatabaseTx,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<Pick<DeadLetterEventPersistence, K>> {
    const row = (await resolvePrismaClient(tx, this.prisma).deadLetterEvent.update({
      where: { id: dlqEventId },
      data: { ...data, status: 'RETRYING' },
      select: buildPrismaSelect<DeadLetterEventPersistence, K>(options?.select),
    })) as Partial<PrismaDeadLetterEvent>;
    return OutboxConverter.toDeadLetterEventPartialPersistence(row) as Pick<
      DeadLetterEventPersistence,
      K
    >;
  }

  // DLQEventStatus has no distinct COMPLETED value (only UNRESOLVED/
  // RETRYING/RESOLVED/IGNORED per the schema check constraint) — RESOLVED
  // is the terminal-success state this maps to.
  async markAsCompleted<
    K extends keyof DeadLetterEventPersistence = keyof DeadLetterEventPersistence,
  >(
    dlqEventId: string,
    data: Omit<UpdateDeadLetterEventInput, 'status'>,
    tx?: DatabaseTx,
    options?: DeadLetterEventPersistenceQueryOptions<K>,
  ): Promise<Pick<DeadLetterEventPersistence, K>> {
    const row = (await resolvePrismaClient(tx, this.prisma).deadLetterEvent.update({
      where: { id: dlqEventId },
      data: { ...data, status: 'RESOLVED', resolvedAt: data.resolvedAt ?? new Date() },
      select: buildPrismaSelect<DeadLetterEventPersistence, K>(options?.select),
    })) as Partial<PrismaDeadLetterEvent>;
    return OutboxConverter.toDeadLetterEventPartialPersistence(row) as Pick<
      DeadLetterEventPersistence,
      K
    >;
  }
}
