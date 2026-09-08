import { Inject, Injectable, Optional } from '@nestjs/common';
import type { QueueJobProcessor } from '@workspace/queue';
import { EventSeverity, QueueNames, SystemEventSource } from '@workspace/constants';
import {
  AUDIT_COMMAND_PORT,
  AuditCommandPort,
  DEAD_LETTER_EVENT_REPOSITORY_TOKEN,
  DeadLetterEventRepositoryPort,
  LOGGER_TOKEN,
  LoggerPort,
  METRICS_PORT_TOKEN,
  MetricsPort,
} from '@workspace/ports';

/**
 * Payload enqueued onto QueueNames.DEAD_LETTER by OutboxDispatchService once
 * an outbox row exhausts its retry budget.
 */
export interface DeadLetterJob {
  eventId: string;
  eventType: string;
  error: string;
  stack?: string;
  attempts?: number;
  payload?: Record<string, unknown>;
}

/**
 * Terminal sink for events that exhausted their retries. Before this existed,
 * OutboxDispatchService enqueued onto DEAD_LETTER and nothing consumed it —
 * every job stayed in BullMQ's `wait` list forever, so the queue was a
 * monotonic Redis leak rather than a dead-letter store.
 *
 * Persisting to workspace_outbox.dead_letter_events is what makes the job
 * terminal: the row is the durable record (queryable, replayable via
 * DeadLetterEventRepositoryPort.retryDLQEvent), and the BullMQ job completes
 * and is trimmed by removeOnComplete.
 */
@Injectable()
export class DeadLetterDispatchService implements QueueJobProcessor<DeadLetterJob> {
  private readonly context = DeadLetterDispatchService.name;

  constructor(
    @Inject(DEAD_LETTER_EVENT_REPOSITORY_TOKEN)
    private readonly deadLetters: DeadLetterEventRepositoryPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Inject(METRICS_PORT_TOKEN) private readonly metrics: MetricsPort,
    // Generic events infra has no natural import path into one bounded
    // context's module tree — @Optional() against AuditPersistenceModule's
    // @Global() AUDIT_COMMAND_PORT, no-ops if that module isn't in this
    // process.
    @Optional()
    @Inject(AUDIT_COMMAND_PORT)
    private readonly auditCommand?: AuditCommandPort,
  ) {}

  async process(data: DeadLetterJob): Promise<void> {
    // `status` is deliberately not set — the column defaults to 'UNRESOLVED',
    // the first of the four values its CHECK constraint allows. (Note the
    // DLQEventStatus union in @workspace/ports' outbox types lists a different,
    // stale set — 'PENDING'/'REPROCESSING'/'ABANDONED' — which the database
    // would reject. Omitting the field sidesteps that mismatch entirely.)
    await this.deadLetters.create({
      source: QueueNames.DEAD_LETTER,
      originalEventId: data.eventId,
      eventType: data.eventType,
      payload: data.payload ?? {},
      errorMessage: data.error,
      errorStack: data.stack ?? null,
    });

    this.metrics?.increment?.('outbox.dead_lettered', { eventType: data.eventType });

    // Identifiers and the failure reason only — the payload can carry PII and
    // payment details, and it is already persisted above.
    this.logger.error(
      `Event dead-lettered [id=${data.eventId}, type=${data.eventType}, attempts=${data.attempts ?? 'unknown'}]: ${data.error}`,
      data.stack,
      this.context,
    );

    // Fire-and-forget SystemEvent write. workspace_audit.system_events is
    // create-only (see AuditPersistenceModule's doc comment) — never awaited
    // into the main flow, a write failure here must never affect the DLQ job
    // completing.
    void this.auditCommand
      ?.createSystemEvent({
        source: SystemEventSource.WORKERS,
        eventType: 'dlq.event_dead_lettered',
        severity: EventSeverity.CRITICAL,
        message: data.error,
        metadata: { eventId: data.eventId, eventType: data.eventType, attempts: data.attempts },
      })
      .catch((e: unknown) =>
        this.logger.warn(`SystemEvent write failed: ${String(e)}`, this.context),
      );
  }
}
