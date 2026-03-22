import { IdPrefixes } from '@repo/constants';
import { CONTEXT_TOKEN, type ContextPort, OutboxEvent, OutboxPort } from '@repo/ports';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '../../../generated/prisma';
import { generateId } from '../../utils/generate-id';
import { resolvePrismaClient } from '../../utils/prisma-client-resolver';

@Injectable()
export class PrismaOutboxAdapter implements OutboxPort {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CONTEXT_TOKEN) private readonly context?: ContextPort,
  ) {}

  async enqueueTx(event: OutboxEvent, tx?: Prisma.TransactionClient): Promise<void> {
    const client = resolvePrismaClient(this.prisma, this.context, tx);
    const id = event.id || generateId(IdPrefixes.OUTBOX_EVENT);

    await client.outboxEvent.create({
      data: {
        ...event,
        id,
        payload: event.payload as Prisma.InputJsonValue,
        metadata: event.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async fetchPending(limit: number): Promise<OutboxEvent[]> {
    return await this.prisma.db.$transaction(async (tx) => {
      const events = await tx.outboxEvent.findMany({
        where: {
          status: {
            in: ['PENDING', 'FAILED'],
          },
          OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      if (events.length === 0) return [];

      await tx.outboxEvent.updateMany({
        where: {
          id: { in: events.map((e) => e.id) },
        },
        data: {
          status: 'PROCESSING',
          attempts: { increment: 1 },
        },
      });

      return events;
    });
  }

  async markProcessed(eventId: string): Promise<void> {
    await resolvePrismaClient(this.prisma, this.context).outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });
  }
  async markFailed(eventId: string, error: string, retryAt?: Date): Promise<void> {
    await resolvePrismaClient(this.prisma, this.context).outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'FAILED',
        lastError: error,
        failedAt: new Date(),
        nextRetryAt: retryAt ?? new Date(Date.now() + 60_000),
      },
    });
  }
}
