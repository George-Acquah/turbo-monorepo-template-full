import { ConflictException, Injectable, Inject, Optional } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { IdPrefixes } from '@repo/constants';
import { IdempotencyDecision, IdempotencyPort, METRICS_PORT_TOKEN, MetricsPort } from '@repo/ports';
import { MongoService } from '../../mongo.service';
import { generateId } from '../../utils/generate-id';

@Injectable()
export class MongoIdempotencyAdapter implements IdempotencyPort {
  constructor(
    private readonly mongo: MongoService,
    @Optional()
    @Inject(METRICS_PORT_TOKEN)
    private readonly metrics?: MetricsPort,
  ) {}

  async begin(input: {
    key: string;
    scope: string;
    requestHash?: string;
    ttlSeconds: number;
    tx?: unknown;
  }): Promise<IdempotencyDecision> {
    return this.metrics
      ? this.metrics.time('idempotency.begin.duration', { scope: input.scope }, () =>
          this.beginInternal(input),
        )
      : this.beginInternal(input);
  }

  async complete(input: {
    key: string;
    scope: string;
    responseData?: unknown;
    statusCode?: number;
    tx?: unknown;
  }): Promise<void> {
    return this.metrics
      ? this.metrics.time('idempotency.complete.duration', { scope: input.scope }, () =>
          this.completeInternal(input),
        )
      : this.completeInternal(input);
  }

  async fail(input: { key: string; scope: string; error: string; tx?: unknown }): Promise<void> {
    return this.metrics
      ? this.metrics.time('idempotency.fail.duration', { scope: input.scope }, () =>
          this.failInternal(input),
        )
      : this.failInternal(input);
  }

  private async beginInternal({
    key,
    scope,
    requestHash,
    ttlSeconds,
    tx,
  }: {
    key: string;
    scope: string;
    requestHash?: string;
    ttlSeconds: number;
    tx?: unknown;
  }): Promise<IdempotencyDecision> {
    const session = tx as ClientSession | undefined;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    try {
      await this.mongo.db.events.idempotencyKey.create(
        [
          {
            _id: generateId(IdPrefixes.IDEMPOTENCY_KEY),
            key,
            scope,
            request_hash: requestHash ?? null,
            response_data: null,
            status_code: null,
            status: 'IN_PROGRESS',
            entity_type: null,
            entity_id: null,
            expires_at: expiresAt,
            created_at: new Date(),
            completed_at: null,
          },
        ],
        session ? { session } : undefined,
      );

      return { decision: 'EXECUTE' };
    } catch (error) {
      if (!this.isDuplicateError(error)) {
        throw error;
      }

      const existing = await this.mongo.db.events.idempotencyKey.findOne({ scope, key }).lean();
      if (!existing) {
        return { decision: 'EXECUTE' };
      }

      if (requestHash && existing.request_hash && existing.request_hash !== requestHash) {
        throw new ConflictException('Idempotency key reused with a different payload');
      }

      if (existing.status === 'IN_PROGRESS' && existing.expires_at < new Date()) {
        const claimed = await this.mongo.db.events.idempotencyKey.updateOne(
          {
            scope,
            key,
            status: 'IN_PROGRESS',
            expires_at: { $lt: new Date() },
          },
          {
            $set: {
              expires_at: expiresAt,
              completed_at: null,
              status_code: null,
            },
          },
          session ? { session } : undefined,
        );

        if (claimed.modifiedCount === 1) {
          return { decision: 'EXECUTE' };
        }
      }

      this.metrics?.increment('idempotency.skipped', { scope });

      return {
        decision: 'SKIP',
        responseData: existing.response_data,
        statusCode: existing.status_code ?? undefined,
      };
    }
  }

  private async completeInternal({
    key,
    scope,
    responseData,
    statusCode,
    tx,
  }: {
    key: string;
    scope: string;
    responseData?: unknown;
    statusCode?: number;
    tx?: unknown;
  }): Promise<void> {
    const session = tx as ClientSession | undefined;

    await this.mongo.db.events.idempotencyKey.updateOne(
      { scope, key },
      {
        $set: {
          status: 'COMPLETED',
          response_data: responseData ?? null,
          status_code: statusCode ?? null,
          completed_at: new Date(),
        },
      },
      session ? { session } : undefined,
    );
  }

  private async failInternal({
    key,
    scope,
    error,
    tx,
  }: {
    key: string;
    scope: string;
    error: string;
    tx?: unknown;
  }): Promise<void> {
    const session = tx as ClientSession | undefined;

    await this.mongo.db.events.idempotencyKey.updateOne(
      { scope, key },
      {
        $set: {
          status: 'FAILED',
          response_data: { error },
          completed_at: new Date(),
        },
      },
      session ? { session } : undefined,
    );
  }

  private isDuplicateError(error: unknown): boolean {
    return (error as { code?: number })?.code === 11000;
  }
}
