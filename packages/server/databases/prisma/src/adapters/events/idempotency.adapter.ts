/* eslint-disable @typescript-eslint/no-explicit-any */
import { IdPrefixes } from '@repo/constants';
import {
  CONTEXT_TOKEN,
  type ContextPort,
  IdempotencyDecision,
  IdempotencyPort,
  METRICS_PORT_TOKEN,
  MetricsPort,
} from '@repo/ports';
import { ConflictException, Injectable } from '@nestjs/common';
import { Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '../../../generated/prisma';
import { generateId } from '../../utils/generate-id';
import { resolvePrismaClient } from '../../utils/prisma-client-resolver';
import { toInputJson } from '../../utils/prisma-mappers';

@Injectable()
export class PrismaIdempotencyAdapter implements IdempotencyPort {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(METRICS_PORT_TOKEN)
    private readonly metrics?: MetricsPort,
    @Optional() @Inject(CONTEXT_TOKEN) private readonly context?: ContextPort,
  ) {}

  async begin({
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
    return this.metrics
      ? this.metrics.time('idempotency.begin.duration', { scope }, () =>
          this.beginInternal({ key, scope, requestHash, ttlSeconds, tx }),
        )
      : this.beginInternal({ key, scope, requestHash, ttlSeconds, tx });
  }

  async complete({
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
    return this.metrics
      ? this.metrics.time('idempotency.complete.duration', { scope }, () =>
          this.completeInternal({ key, scope, responseData, statusCode, tx }),
        )
      : this.completeInternal({ key, scope, responseData, statusCode, tx });
  }

  async fail({
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
    return this.metrics
      ? this.metrics.time('idempotency.fail.duration', { scope }, () =>
          this.failInternal({ key, scope, error, tx }),
        )
      : this.failInternal({ key, scope, error, tx });
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
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const client = resolvePrismaClient(this.prisma, this.context, tx);

    try {
      await this.metrics?.time('idempotency.insert.duration', { scope }, () => {
        return client.idempotencyKey.create({
          data: {
            id: generateId(IdPrefixes.IDEMPOTENCY_KEY),
            key,
            scope,
            requestHash,
            status: 'IN_PROGRESS',
            expiresAt,
          },
        });
      });

      return { decision: 'EXECUTE' };
    } catch (e: any) {
      if (e.code !== 'P2002') throw e;

      const existing = await client.idempotencyKey.findUnique({
        where: { scope_key: { scope, key } },
      });

      if (!existing) return { decision: 'EXECUTE' };

      if (requestHash && existing.requestHash && existing.requestHash !== requestHash) {
        throw new ConflictException('Idempotency key reused with a different payload');
      }

      if (existing.status === 'IN_PROGRESS' && existing.expiresAt < new Date()) {
        const claimed = await this.metrics?.time('idempotency.takeover.duration', { scope }, () =>
          client.idempotencyKey.updateMany({
            where: { scope, key, status: 'IN_PROGRESS', expiresAt: { lt: new Date() } },
            data: { expiresAt, completedAt: null, statusCode: null },
          }),
        );

        if (claimed?.count === 1) return { decision: 'EXECUTE' };
      }

      this.metrics?.increment('idempotency.skipped', { scope });

      return {
        decision: 'SKIP',
        responseData: existing.responseData,
        statusCode: existing.statusCode ?? undefined,
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
    const client = resolvePrismaClient(this.prisma, this.context, tx);
    await client.idempotencyKey.update({
      where: {
        scope_key: { scope, key },
      },
      data: {
        status: 'COMPLETED',
        responseData: toInputJson(
          responseData === undefined ? undefined : (responseData as Record<string, unknown> | null),
        ),
        statusCode,
        completedAt: new Date(),
      },
    });
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
    const client = resolvePrismaClient(this.prisma, this.context, tx);
    await client.idempotencyKey.update({
      where: {
        scope_key: { scope, key },
      },
      data: {
        status: 'FAILED',
        responseData: { error } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });
  }
}
