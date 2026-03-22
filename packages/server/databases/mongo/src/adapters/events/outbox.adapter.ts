import { IdPrefixes } from '@repo/constants';
import { OutboxEvent, OutboxPort } from '@repo/ports';
import { Inject, Injectable } from '@nestjs/common';
import type { ClientSession } from 'mongoose';
import { type MongoDbClient } from '../../mongo-db-client.provider';
import { MONGO_DB_CLIENT_TOKEN } from '../../tokens/mongo.tokens';
import { generateId } from '../../utils/generate-id';
import type { OutboxEventDocument } from '../../schemas';

@Injectable()
export class MongoOutboxAdapter implements OutboxPort {
  constructor(@Inject(MONGO_DB_CLIENT_TOKEN) private readonly mongoDb: MongoDbClient) {}

  async enqueueTx(event: OutboxEvent, tx?: unknown): Promise<void> {
    const session = tx as ClientSession | undefined;

    await this.mongoDb.events.outboxEvent.create(
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
    const claimedEvents: OutboxEventDocument[] = [];
    const now = new Date();

    for (let index = 0; index < limit; index += 1) {
      // Claim one event at a time with an atomic state transition so multiple workers
      // can safely poll even when Mongo transactions are unavailable.
      const claimed = (await this.mongoDb.events.outboxEvent
        .findOneAndUpdate(
          {
            status: 'PENDING',
            attempts: { $lt: 5 },
            $or: [{ next_retry_at: { $lte: now } }, { next_retry_at: null }],
          },
          {
            $set: {
              status: 'PROCESSING',
              updated_at: new Date(),
            },
            $inc: { attempts: 1 },
          },
          {
            sort: { created_at: 1 },
            new: true,
            lean: true,
          },
        )
        .exec()) as OutboxEventDocument | null;

      if (!claimed) {
        break;
      }

      claimedEvents.push(claimed);
    }

    return claimedEvents.map((event) => ({
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
  }

  async markProcessed(id: string): Promise<void> {
    await this.mongoDb.events.outboxEvent.updateOne(
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
    await this.mongoDb.events.outboxEvent.updateOne(
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
