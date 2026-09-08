import { Inject, Injectable } from '@nestjs/common';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import type { OutboxEvent as PrismaOutboxEventModel } from '@workspace/prisma/client';

/**
 * Shape returned by the claim statement. Typed as the Prisma model rather
 * than the port's persistence type on purpose: the column aliases below
 * reproduce exactly what the fluent API would return, so these rows feed
 * OutboxConverter unchanged. (The pg driver adapter returns raw column names
 * verbatim — it does not apply Prisma's @map — hence the aliases.)
 */
type ClaimedOutboxRow = PrismaOutboxEventModel;

@Injectable()
export class OutboxEventQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  /**
   * Atomically claims a batch of dispatchable rows.
   *
   * `FOR UPDATE SKIP LOCKED` on the inner select is what makes this safe for
   * concurrent workers: each transaction locks the rows it selects and skips
   * any already locked by another worker, so two replicas draining at once
   * take disjoint batches instead of both reading the same 100 rows. The
   * outer UPDATE then flips them to PROCESSING in the same statement, so
   * there is no window where a row is claimed-but-unmarked.
   *
   * The predicate covers retries as well as fresh work — PENDING rows have a
   * NULL `next_retry_at`, FAILED rows carry the backoff deadline set by
   * `markFailed` — so one statement serves both and FAILED rows can no longer
   * be stranded.
   */
  claimPendingEvents(batchSize: number, tx?: unknown): Promise<ClaimedOutboxRow[]> {
    return resolvePrismaClient(tx, this.prisma).$queryRaw<ClaimedOutboxRow[]>`
      UPDATE workspace_outbox.outbox_events
      SET status = 'PROCESSING', last_attempt_at = now()
      WHERE id IN (
        SELECT id
        FROM workspace_outbox.outbox_events
        WHERE status IN ('PENDING', 'FAILED')
          AND (next_retry_at IS NULL OR next_retry_at <= now())
        ORDER BY created_at ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING
        id,
        aggregate_type   AS "aggregateType",
        aggregate_id     AS "aggregateId",
        event_type       AS "eventType",
        event_version    AS "eventVersion",
        payload,
        metadata,
        correlation_id   AS "correlationId",
        partition_key    AS "partitionKey",
        status,
        attempts,
        max_attempts     AS "maxAttempts",
        last_attempt_at  AS "lastAttemptAt",
        next_retry_at    AS "nextRetryAt",
        last_error       AS "lastError",
        published_at     AS "publishedAt",
        created_at       AS "createdAt",
        updated_at       AS "updatedAt"
    `;
  }

  /**
   * Returns rows stranded in PROCESSING by a worker that died mid-batch.
   * `last_attempt_at` is stamped by the claim above, so it doubles as the
   * claim timestamp and this stays a single-column range scan.
   */
  async reclaimStuckProcessing(stuckBefore: Date, tx?: unknown): Promise<number> {
    return resolvePrismaClient(tx, this.prisma).$executeRaw`
      UPDATE workspace_outbox.outbox_events
      SET status = 'PENDING'
      WHERE status = 'PROCESSING'
        AND last_attempt_at < ${stuckBefore}
    `;
  }
}
