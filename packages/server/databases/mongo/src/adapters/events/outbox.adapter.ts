import { IdPrefixes } from '@repo/constants';
import { OutboxEvent, OutboxPort } from '@repo/ports';
import { Injectable } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { MongoService } from '../../mongo.service';
import { generateId } from '../../utils/generate-id';

@Injectable()
export class MongoOutboxAdapter implements OutboxPort {
  constructor(private readonly mongo: MongoService) {}

  async enqueueTx(event: OutboxEvent, tx?: unknown): Promise<void> {
    const session = tx as ClientSession | undefined;

    await this.mongo.db.events.outboxEvent.create(
      [
        {
          _id: generateId(IdPrefixes.OUTBOX_EVENT),
          event_type: event.eventType,
          aggregate_type: event.aggregateType,
          aggregate_id: event.aggregateId,
          payload: event.payload,
          metadata: event.metadata ?? null,
          version: 1,
          correlation_id: event.correlationId ?? null,
          causation_id: null,
          status: event.status,
          attempts: 0,
          max_attempts: 5,
          next_retry_at: new Date(),
          last_error: null,
          processed_at: null,
          failed_at: null,
          created_at: event.createdAt ?? new Date(),
          updated_at: new Date(),
        },
      ],
      session ? { session } : undefined,
    );
  }

  async fetchPending(limit: number): Promise<OutboxEvent[]> {
    const session = await this.mongo.getConnection().startSession();
    try {
      let events: Array<{
        _id: string;
        event_type: string;
        aggregate_type: string;
        aggregate_id: string;
        payload: unknown;
        metadata?: unknown;
        correlation_id?: string | null;
        status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'DEAD_LETTERED';
        created_at: Date;
      }> = [];

      await session.withTransaction(async () => {
        events = await this.mongo.db.events.outboxEvent
          .find({
            status: 'PENDING',
            $and: [{ attempts: { $lt: 5 } }],
            $or: [{ next_retry_at: { $lte: new Date() } }, { next_retry_at: null }],
          })
          .sort({ created_at: 1 })
          .limit(limit)
          .session(session)
          .lean();

        if (events.length === 0) {
          return;
        }

        await this.mongo.db.events.outboxEvent.updateMany(
          { _id: { $in: events.map((event) => event._id) } },
          {
            $set: {
              status: 'PROCESSING',
              updated_at: new Date(),
            },
            $inc: { attempts: 1 },
          },
          { session },
        );
      });

      return events.map((event) => ({
        id: event._id,
        eventType: event.event_type,
        aggregateType: event.aggregate_type,
        aggregateId: event.aggregate_id,
        payload: event.payload,
        metadata: event.metadata,
        correlationId: event.correlation_id ?? null,
        status: event.status,
        createdAt: event.created_at,
      }));
    } finally {
      await session.endSession();
    }
  }

  async markProcessed(id: string): Promise<void> {
    await this.mongo.db.events.outboxEvent.updateOne(
      { _id: id },
      {
        $set: {
          status: 'PROCESSED',
          processed_at: new Date(),
          updated_at: new Date(),
        },
      },
    );
  }

  async markFailed(id: string, error: string, retryAt?: Date): Promise<void> {
    await this.mongo.db.events.outboxEvent.updateOne(
      { _id: id },
      {
        $set: {
          status: 'FAILED',
          last_error: error,
          failed_at: new Date(),
          next_retry_at: retryAt ?? new Date(Date.now() + 60_000),
          updated_at: new Date(),
        },
      },
    );
  }
}
