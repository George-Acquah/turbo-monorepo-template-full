import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  IdempotencyKeyRepositoryPort,
  type IdempotencyKeyPersistence,
  type CreateIdempotencyKeyInput,
  type UpdateIdempotencyKeyInput,
  type IdempotencyDecision,
  type IdempotencyKeyPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import { OutboxConverter } from '../converter/outbox.converter';
import { IdempotencyKeyQuery } from '../queries/idempotency-key.query';

@Injectable()
export class PrismaIdempotencyKeyAdapter implements IdempotencyKeyRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly idempotencyKeyQuery: IdempotencyKeyQuery,
  ) {}

  async begin(input: CreateIdempotencyKeyInput, tx?: DatabaseTx): Promise<IdempotencyDecision> {
    const client = resolvePrismaClient(tx, this.prisma);
    const existing = await client.idempotencyKey.findUnique({
      where: { scope_key: { scope: input.scope, key: input.key } },
    });

    if (!existing) {
      await client.idempotencyKey.create({
        data: {
          id: input.id ?? generateId(IdPrefixes.IDEMPOTENCY_KEY),
          key: input.key,
          scope: input.scope,
          requestHash: input.requestHash,
          expiresAt: input.expiresAt,
          status: 'IN_PROGRESS',
        },
      });
      return { decision: 'EXECUTE' };
    }

    if (existing.status === 'COMPLETED') {
      return {
        decision: 'SKIP',
        responseData: existing.responsePayload ?? undefined,
        statusCode: existing.statusCode ?? undefined,
      };
    }

    // IN_PROGRESS within its TTL is a genuine in-flight duplicate — dedupe.
    // Past its TTL it's a stuck lock (crashed worker), so it falls through
    // and gets reclaimed below rather than blocking the job forever.
    if (existing.status === 'IN_PROGRESS' && existing.expiresAt > new Date()) {
      return { decision: 'SKIP' };
    }

    await client.idempotencyKey.update({
      where: { id: existing.id },
      data: {
        status: 'IN_PROGRESS',
        requestHash: input.requestHash,
        expiresAt: input.expiresAt,
        completedAt: null,
      },
    });
    return { decision: 'EXECUTE' };
  }

  async complete(
    input: Omit<CreateIdempotencyKeyInput, 'requestHash' | 'expiresAt'>,
    tx?: DatabaseTx,
  ): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).idempotencyKey.update({
      where: { scope_key: { scope: input.scope, key: input.key } },
      data: {
        status: 'COMPLETED',
        responsePayload: (input.responsePayload as object | null) ?? undefined,
        statusCode: input.statusCode ?? undefined,
        completedAt: new Date(),
      },
    });
  }

  async fail(
    input: Omit<CreateIdempotencyKeyInput, 'requestHash' | 'expiresAt'>,
    tx?: DatabaseTx,
  ): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).idempotencyKey.update({
      where: { scope_key: { scope: input.scope, key: input.key } },
      data: { status: 'FAILED', completedAt: new Date() },
    });
  }

  // tenantId is a legacy multi-tenant leftover — this schema is single-tenant
  // (doc header) and the unique constraint is (scope, key) only.
  async findByKey<K extends keyof IdempotencyKeyPersistence = keyof IdempotencyKeyPersistence>(
    tenantId: string | null,
    scope: string,
    key: string,
    tx?: DatabaseTx,
    options?: IdempotencyKeyPersistenceQueryOptions<K>,
  ): Promise<Pick<IdempotencyKeyPersistence, K> | null> {
    void tenantId;
    const row = await this.idempotencyKeyQuery.findByKey(scope, key, tx, options);
    return row
      ? (OutboxConverter.toIdempotencyKeyPartialPersistence(row) as Pick<
          IdempotencyKeyPersistence,
          K
        >)
      : null;
  }

  async update<K extends keyof IdempotencyKeyPersistence = keyof IdempotencyKeyPersistence>(
    id: string,
    data: UpdateIdempotencyKeyInput,
    tx?: DatabaseTx,
    options?: IdempotencyKeyPersistenceQueryOptions<K>,
  ): Promise<Pick<IdempotencyKeyPersistence, K>> {
    const { responsePayload, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).idempotencyKey.update({
      where: { id },
      data: { ...rest, responsePayload: (responsePayload as object | null) ?? undefined },
      select: buildPrismaSelect<IdempotencyKeyPersistence, K>(options?.select),
    });
    return OutboxConverter.toIdempotencyKeyPartialPersistence(row) as Pick<
      IdempotencyKeyPersistence,
      K
    >;
  }

  async deleteExpiredKeys(now: Date, tx?: DatabaseTx): Promise<number> {
    const result = await resolvePrismaClient(tx, this.prisma).idempotencyKey.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    return result.count;
  }
}
