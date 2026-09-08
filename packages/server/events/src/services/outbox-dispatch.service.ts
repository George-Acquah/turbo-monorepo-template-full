import { Inject, Injectable, Optional } from '@nestjs/common';
import type { QueueJobProcessor } from '@workspace/queue';
import {
  DefaultJobOptions,
  EventSeverity,
  JobNames,
  QueueNames,
  SystemEventSource,
} from '@workspace/constants';
import {
  AUDIT_COMMAND_PORT,
  AuditCommandPort,
  LOGGER_TOKEN,
  LoggerPort,
  METRICS_PORT_TOKEN,
  MetricsPort,
  OUTBOX_EVENT_REPOSITORY_TOKEN,
  OutboxEventPersistence,
  OutboxEventRepositoryPort,
  QUEUE_BUS_TOKEN,
  QueueBusPort,
} from '@workspace/ports';
import { WorkspaceEvent } from '@workspace/types';

const BATCH_SIZE = 100;
const MAX_RETRY_DELAY_MS = 300_000; // 5m
const BASE_RETRY_DELAY_MS = 1_000; // 1s

/**
 * How long a row may sit in PROCESSING before the reap sweep assumes the
 * worker that claimed it died and returns it to PENDING. Must stay
 * comfortably above the longest plausible drain so a slow-but-alive worker is
 * never undercut; 5m against a drain measured in seconds is ample.
 */
const STUCK_PROCESSING_AFTER_MS = 300_000; // 5m

/**
 * Bounds on the adaptive drain. When a claim comes back full there is more
 * work waiting, so draining again immediately beats idling until the next
 * tick — otherwise throughput is capped at BATCH_SIZE per poll interval
 * regardless of how far behind the outbox is.
 *
 * Both bounds exist because either alone is insufficient: iterations cap the
 * work, wall clock caps the time a slow database can hold the job open.
 * BullMQ's default lockDuration is 30s (renewed every 15s by the lock
 * extender), so staying an order of magnitude under it keeps the job from
 * being declared stalled and replayed if the event loop is briefly starved.
 */
const MAX_DRAIN_ITERATIONS = 10;
const MAX_DRAIN_DURATION_MS = 10_000;

/**
 * How long PROCESSED rows are kept before the prune sweep deletes them.
 *
 * They are dispatch bookkeeping, not the event record — the durable history
 * lives in the audit context, and dead-lettered events keep their own rows.
 * A week is enough to investigate a delivery question after the fact while
 * keeping the table (and therefore the claim query's index) small.
 */
const PROCESSED_RETENTION_MS = 7 * 24 * 60 * 60 * 1_000; // 7d

export interface OutboxBatchJob {
  batchId: string;
  /**
   * Which sweep this job represents. Every scheduler registered by
   * OutboxSchedulerService targets the same queue and processor, so the
   * payload is what distinguishes them. Absent means 'drain' — the repeatable
   * job created before this field existed carries no mode.
   */
  mode?: 'drain' | 'reap' | 'prune';
}

interface OutboxEventMetadata {
  workspaceEvent: WorkspaceEvent<unknown>;
  userId?: string;
  correlationId?: string;
  causationId?: string;
  [key: string]: unknown;
}

/**
 * Drains pending outbox rows onto the `domain-events` queue. Plugged into a
 * BullMQ consumer via `createQueueConsumer(QueueNames.OUTBOX_PROCESSOR,
 * OutboxDispatchService)` (see `modules/processing.module.ts`) — this class
 * itself never touches BullMQ, only `QueueBusPort`.
 */
@Injectable()
export class OutboxDispatchService implements QueueJobProcessor<OutboxBatchJob> {
  private readonly context = OutboxDispatchService.name;

  constructor(
    @Inject(QUEUE_BUS_TOKEN) private readonly bus: QueueBusPort,
    @Inject(OUTBOX_EVENT_REPOSITORY_TOKEN) private readonly outbox: OutboxEventRepositoryPort,
    @Inject(METRICS_PORT_TOKEN) private readonly metrics: MetricsPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    // Generic events infra has no natural import path into one bounded
    // context's module tree — @Optional() against AuditPersistenceModule's
    // @Global() AUDIT_COMMAND_PORT, no-ops if that module isn't in this
    // process.
    @Optional()
    @Inject(AUDIT_COMMAND_PORT)
    private readonly auditCommand?: AuditCommandPort,
  ) {}

  async process(data: OutboxBatchJob): Promise<void> {
    if (data?.mode === 'reap') {
      await this.reclaimStuckEvents();
      return;
    }

    if (data?.mode === 'prune') {
      await this.pruneProcessedEvents();
      return;
    }

    // Distinguish a scheduled safety-net poll from an event-driven nudge.
    // EventPublisherService enqueues its nudge with batchId 'nudge'
    // (event-publisher.service.ts), the repeatable scheduler uses 'outbox'.
    // Without this label an empty poll and a real wakeup are indistinguishable
    // in the histogram, so there is no way to tell whether widening the poll
    // interval hurt latency.
    await this.processPendingEvents(data?.batchId === 'nudge' ? 'nudge' : 'poll');
  }

  /**
   * Deletes PROCESSED rows past their retention window. Without this the
   * outbox only ever grows, and the claim query pays for scanning an index
   * that is almost entirely rows it will never select again.
   */
  private async pruneProcessedEvents(): Promise<void> {
    const olderThan = new Date(Date.now() - PROCESSED_RETENTION_MS);
    const pruned = await this.outbox.pruneProcessedEvents(olderThan);

    if (pruned > 0) {
      // Count is the INCREMENT, not a label: `{ count: '37' }` would mint a new
      // permanent series per distinct value and still only add 1.
      this.metrics?.increment?.('outbox.events_pruned', undefined, pruned);
      this.logger.log(
        `Pruned ${pruned} processed outbox event(s) older than ${olderThan.toISOString()}`,
        this.context,
      );
    }
  }

  /**
   * Returns rows abandoned in PROCESSING by a worker that died mid-batch back
   * to PENDING. Without this they are invisible to the claim query forever,
   * because the claim only looks at PENDING and FAILED.
   */
  private async reclaimStuckEvents(): Promise<void> {
    const stuckBefore = new Date(Date.now() - STUCK_PROCESSING_AFTER_MS);
    const reclaimed = await this.outbox.reclaimStuckProcessing(stuckBefore);

    if (reclaimed > 0) {
      this.metrics?.increment?.('outbox.events_reclaimed', undefined, reclaimed);
      this.logger.warn(
        `Reclaimed ${reclaimed} outbox event(s) stuck in PROCESSING since before ${stuckBefore.toISOString()}`,
        this.context,
      );

      // Fire-and-forget SystemEvent write. workspace_audit.system_events is
      // create-only (see AuditPersistenceModule's doc comment) — never
      // awaited into the sweep's main flow.
      void this.auditCommand
        ?.createSystemEvent({
          source: SystemEventSource.WORKERS,
          eventType: 'outbox.events_reclaimed',
          severity: EventSeverity.WARNING,
          message: `Reclaimed ${reclaimed} outbox event(s) stuck in PROCESSING since before ${stuckBefore.toISOString()}`,
          metadata: { reclaimedCount: reclaimed },
        })
        .catch((e: unknown) =>
          this.logger.warn(`SystemEvent write failed: ${String(e)}`, this.context),
        );
    }
  }

  /**
   * Claims and dispatches a single batch. Resolves to the number of rows
   * claimed, which the caller uses to decide whether more work is waiting.
   */
  private async drainOnce(): Promise<number> {
    // Atomically claims the batch (PENDING|FAILED -> PROCESSING via
    // FOR UPDATE SKIP LOCKED), so a concurrent worker cannot take the same
    // rows. Retries are included in the claim, so FAILED rows whose backoff
    // has elapsed come back here rather than being stranded.
    const events = await this.outbox.claimPendingEvents(BATCH_SIZE);
    if (events.length === 0) return 0;

    this.logger.debug(`Processing ${events.length} outbox events`, this.context);

    // Process in parallel with Promise.allSettled for maximum throughput,
    // avoiding a single bad event from stalling the entire batch.
    const results = await Promise.allSettled(events.map((event) => this.processOutboxEvent(event)));

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(`Failed to process ${failed.length} outbox events in batch`, this.context);
    }

    return events.length;
  }

  private async processPendingEvents(wakeupSource: 'poll' | 'nudge'): Promise<void> {
    const run = async () => {
      const startedAt = Date.now();
      let totalDrained = 0;

      for (let iteration = 0; iteration < MAX_DRAIN_ITERATIONS; iteration++) {
        const drained = await this.drainOnce();
        totalDrained += drained;

        // A short batch means the backlog is cleared — stop and let the next
        // tick (or a nudge) wake us.
        if (drained < BATCH_SIZE) {
          this.recordDrained(totalDrained, wakeupSource);
          return;
        }

        if (Date.now() - startedAt >= MAX_DRAIN_DURATION_MS) {
          this.recordDrained(totalDrained, wakeupSource);
          this.logger.warn(
            `Outbox drain hit its ${MAX_DRAIN_DURATION_MS}ms budget with a full batch still pending; resuming on the next tick`,
            this.context,
          );
          return;
        }
      }

      this.recordDrained(totalDrained, wakeupSource);
      this.logger.warn(
        `Outbox drain hit its ${MAX_DRAIN_ITERATIONS}-iteration cap; resuming on the next tick`,
        this.context,
      );
    };

    if (this.metrics?.time) {
      await this.metrics.time('outbox.poll.duration', { wakeup_source: wakeupSource }, run);
    } else {
      await run();
    }
  }

  /**
   * Records how many rows a wakeup actually drained. `drainOnce` already
   * returns this and it was previously discarded, which left no way to tell an
   * idle poll from a productive one, or to alert on the outbox falling behind.
   * Always emitted — including zero — so the counter's rate is meaningful.
   */
  private recordDrained(count: number, wakeupSource: 'poll' | 'nudge'): void {
    this.metrics?.increment?.('outbox.events_drained', { wakeup_source: wakeupSource }, count);
  }

  private async processOutboxEvent(event: OutboxEventPersistence): Promise<void> {
    try {
      const metadata = (event.metadata || {}) as OutboxEventMetadata;
      const envelope = metadata.workspaceEvent;
      const actor = envelope?.actor;
      const trace = envelope?.trace;

      await this.bus.enqueue(
        QueueNames.DOMAIN_EVENTS,
        JobNames.PROCESS_DOMAIN_EVENT,
        {
          eventId: event.id,
          eventType: event.eventType,
          schemaVersion: envelope?.schemaVersion ?? event.eventVersion ?? 1,
          occurredAt: envelope?.occurredAt ?? event.createdAt.toISOString(),
          enqueuedAt: envelope?.enqueuedAt ?? new Date().toISOString(),
          actor,
          trace,
          causationId: envelope?.causationId ?? event.correlationId ?? undefined,
          retryCount: envelope?.retryCount ?? event.attempts ?? 0,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload,
          metadata: {
            ...metadata,
            correlationId: event.correlationId ?? undefined,
            causationId: envelope?.causationId ?? event.correlationId ?? undefined,
            userId: actor?.userId ?? metadata.userId,
          },
        },
        { ...DefaultJobOptions.STANDARD, jobId: event.id }, // Deduplication lock
      );

      // Successfully enqueued to domain events
      await this.outbox.markProcessed(event.id);
      this.metrics?.increment?.('outbox.events_processed', { status: 'success' });
    } catch (err) {
      this.metrics?.increment?.('outbox.events_processed', { status: 'failure' });
      await this.handleFailure(event, err instanceof Error ? err : new Error(String(err)));
      throw err; // Re-throw to be caught by Promise.allSettled
    }
  }

  private async handleFailure(event: OutboxEventPersistence, error: Error): Promise<void> {
    const attempts = Number(event.attempts ?? 0) + 1;
    const maxAttempts = Number(event.maxAttempts ?? 5);

    if (attempts >= maxAttempts) {
      // 1. Move to Dead Letter Queue. The payload rides along so the DLQ row
      //    is replayable on its own — DeadLetterDispatchService persists it,
      //    and a dead-lettered event whose payload was dropped could never be
      //    reprocessed.
      await this.bus.enqueue(
        QueueNames.DEAD_LETTER,
        JobNames.PROCESS_DLQ_EVENT,
        {
          eventId: event.id,
          eventType: event.eventType,
          error: error.message,
          stack: error.stack,
          attempts,
          payload: event.payload,
        },
        DefaultJobOptions.BACKGROUND,
      );

      // 2. Mark permanently failed — a null retryAt is what makes the row
      //    terminal (DEAD_LETTERED) rather than scheduling another attempt.
      await this.outbox.markFailed(event.id, error.message, null);

      this.logger.error(
        `Outbox event dead-lettered [id=${event.id}, type=${event.eventType}] after ${attempts} attempts`,
        error.stack,
        this.context,
      );
      return;
    }

    // Exponential Backoff Calculation
    const delay = Math.min(BASE_RETRY_DELAY_MS * 2 ** (attempts - 1), MAX_RETRY_DELAY_MS);
    const retryAt = new Date(Date.now() + delay);

    // Schedule next retry — claimPendingEvents picks the row back up once
    // nextRetryAt elapses.
    await this.outbox.markFailed(event.id, error.message, retryAt);

    this.logger.warn(
      `Outbox event failed [id=${event.id}, type=${event.eventType}] retry ${attempts}/${maxAttempts} at ${retryAt.toISOString()}`,
      this.context,
    );
  }
}
