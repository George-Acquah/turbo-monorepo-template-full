import { IdPrefixes } from '@repo/constants';
import { OutboxPort, OutboxEvent } from '@repo/ports';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '../../../generated/prisma';
import { generateId } from '../../utils/generate-id';

@Injectable()
export class PrismaOutboxAdapter implements OutboxPort {
  constructor(private readonly prisma: PrismaService) {}

  async enqueueTx(event: OutboxEvent, tx?: Prisma.TransactionClient): Promise<void> {
    const id = generateId(IdPrefixes.OUTBOX_EVENT);

    const client = tx ?? this.prisma.db;

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
          status: 'PENDING',
          nextRetryAt: { lte: new Date() },
          maxAttempts: { lt: 5 },
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
          // lockedAt: new Date(),
          maxAttempts: { increment: 1 },
        },
      });

      return events;
    });
  }

  async markProcessed(eventId: string): Promise<void> {
    await this.prisma.db.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });
  }
  async markFailed(eventId: string, error: string, retryAt?: Date): Promise<void> {
    await this.prisma.db.outboxEvent.update({
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
