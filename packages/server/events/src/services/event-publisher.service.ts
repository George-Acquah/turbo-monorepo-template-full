import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  StrictlyTypedEventInput,
  EventPublisherPort,
  LOGGER_TOKEN,
  LoggerPort,
  METRICS_PORT_TOKEN,
  MetricsPort,
  CONTEXT_TOKEN,
  ContextPort,
  StrictlyTypedOutboxInput,
  TRANSACTION_PORT_TOKEN,
  TransactionPort,
  OUTBOX_EVENT_REPOSITORY_TOKEN,
  OutboxEventRepositoryPort,
  DatabaseTx,
  QUEUE_BUS_TOKEN,
  QueueBusPort,
} from '@workspace/ports';

import { IdPrefixes, JobNames, QueueNames } from '@workspace/constants';
import {
  AllEventsMap,
  DomainEvent,
  DomainEventMetadata,
  EventType,
  WorkspaceEvent,
  WorkspaceEventActor,
  WorkspaceEventTrace,
  PublishOptions,
} from '@workspace/types';
import { generateId } from '@workspace/utils';
import { createEvent } from '@/event-factory';

/**
 * Delay on the drain nudge. `publish()` runs its own transaction, so by the
 * time it resolves the row is committed — but callers may wrap it in an outer
 * transaction, in which case the nudge would otherwise race ahead of the outer
 * COMMIT and find nothing. A short delay closes that window; the periodic poll
 * covers it either way, so this is an optimisation, not a correctness device.
 */
const NUDGE_DELAY_MS = 250;

/** Bucket width for nudge de-duplication. See `nudgeDrain`. */
const NUDGE_BUCKET_MS = 1_000;

@Injectable()
export class EventPublisherService implements EventPublisherPort {
  private readonly context = EventPublisherService.name;

  constructor(
    @Inject(QUEUE_BUS_TOKEN) private readonly bus: QueueBusPort,
    @Inject(OUTBOX_EVENT_REPOSITORY_TOKEN) private readonly outbox: OutboxEventRepositoryPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly tx: TransactionPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Optional() @Inject(CONTEXT_TOKEN) private readonly contextService?: ContextPort,
    @Optional() @Inject(METRICS_PORT_TOKEN) private readonly metrics?: MetricsPort,
  ) {}

  async publish<T extends EventType>(
    input: StrictlyTypedOutboxInput<T>,
    _options: PublishOptions = {},
  ): Promise<string> {
    const eventId = generateId(IdPrefixes.OUTBOX_EVENT);
    const correlationId = input.correlationId || generateId(IdPrefixes.CORRELATION);
    const envelope = this.createEnvelope(input, eventId, correlationId);

    const write = async () =>
      this.tx.execute(async (trx: DatabaseTx) => {
        await this.outbox.enqueueTx(
          {
            id: eventId,
            eventType: input.eventType,
            aggregateType: input.aggregateType,
            aggregateId: input.aggregateId,
            eventVersion: 1,
            payload: input.payload,
            metadata: this.withEnvelopeMetadata(input.metadata, envelope),
            correlationId: correlationId ?? null,
            status: 'PENDING',
            maxAttempts: 5,
            partitionKey: null,
          },
          trx,
        );
      });

    if (this.metrics) {
      await this.metrics.time('outbox.publish.duration', { eventType: input.eventType }, write);
    } else {
      await write();
    }

    this.logger.debug(
      `Event stored in outbox [type=${input.eventType}, id=${eventId}, corr=${correlationId}]`,
      this.context,
    );

    await this.nudgeDrain();

    return eventId;
  }

  async publishBatch<T extends EventType>(
    events: StrictlyTypedOutboxInput<T>[],
  ): Promise<string[]> {
    if (events.length === 0) return [];

    const correlationId = events[0]?.correlationId || generateId('corr');
    const ids: string[] = [];

    const write = async () =>
      this.tx.execute(async (trx: DatabaseTx) => {
        for (const e of events) {
          const eventId = generateId(IdPrefixes.OUTBOX_EVENT);
          ids.push(eventId);
          const envelope = this.createEnvelope(e, eventId, e.correlationId || correlationId);

          await this.outbox.enqueueTx(
            {
              id: eventId,
              eventType: e.eventType,
              aggregateType: e.aggregateType,
              aggregateId: e.aggregateId,
              eventVersion: 1,
              payload: e.payload,
              metadata: this.withEnvelopeMetadata(e.metadata, envelope),
              correlationId: (e.correlationId || correlationId) ?? null,
              status: 'PENDING',
              maxAttempts: 5,
              partitionKey: null,
            },
            trx,
          );
        }
      });

    if (this.metrics) {
      await this.metrics.time('outbox.publish_batch.duration', undefined, write);
    } else {
      await write();
    }

    this.logger.log(`Stored ${events.length} outbox events [corr=${correlationId}]`, this.context);

    await this.nudgeDrain();

    return ids;
  }

  /**
   * Wakes the outbox drain so a freshly written event dispatches in
   * milliseconds instead of waiting out the poll interval.
   *
   * De-duplicated by bucketing `jobId` to the second: BullMQ rejects a job
   * whose id already exists, so a burst of publishes within the same second
   * collapses to a single drain job rather than one per event. That is what
   * keeps this cheap enough to run on every publish.
   *
   * Never throws. A failed nudge only costs latency — the periodic poll still
   * drains the row — and an event must not fail to publish because Redis
   * hiccuped after the row was already committed.
   */
  private async nudgeDrain(): Promise<void> {
    try {
      await this.bus.enqueue(
        QueueNames.OUTBOX_PROCESSOR,
        JobNames.PROCESS_OUTBOX_BATCH,
        { batchId: 'nudge', mode: 'drain' },
        {
          jobId: `nudge-${Math.floor(Date.now() / NUDGE_BUCKET_MS)}`,
          delay: NUDGE_DELAY_MS,
          removeOnComplete: true,
          removeOnFail: 50,
          // Retrying is pointless: the poll is the backstop, and a retry would
          // just drain an outbox that the original job already emptied.
          attempts: 1,
        },
      );
    } catch (err) {
      this.logger.debug(
        `Outbox drain nudge failed, falling back to the poll interval: ${
          err instanceof Error ? err.message : String(err)
        }`,
        this.context,
      );
    }
  }

  async publishDirect<T extends EventType>(
    input: StrictlyTypedEventInput<T>,
    options: PublishOptions = {},
  ): Promise<string> {
    const eventId = generateId(IdPrefixes.OUTBOX_EVENT);
    const correlationId = input.correlationId || generateId('corr');
    const envelope = this.createEnvelope(input, eventId, correlationId);

    const metadata: DomainEventMetadata = {
      correlationId,
      causationId: input.causationId,
      userId: input.userId,
      timestamp: new Date(),
      version: 1,
      source: this.context,
    };

    const event: DomainEvent<AllEventsMap[T], T> & Partial<WorkspaceEvent<AllEventsMap[T]>> = {
      ...envelope,
      eventId,
      eventType: input.eventType,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payload: input.payload,
      metadata,
    };

    const write = async () =>
      this.bus.enqueue(QueueNames.DOMAIN_EVENTS, JobNames.PROCESS_DOMAIN_EVENT, event, {
        jobId: eventId,
        delay: options.delay,
        priority: options.priority,
      });

    if (this.metrics) {
      await this.metrics.time(
        'event.publish_direct.duration',
        { eventType: input.eventType },
        write,
      );
    } else {
      await write();
    }

    this.logger.debug(
      `Event queued directly [type=${input.eventType}, id=${eventId}]`,
      this.context,
    );
    return eventId;
  }

  /**
   * Deliberately does NOT nudge the drain: the caller owns the transaction, so
   * at this point the row is written but not committed. A nudge here would
   * race the caller's COMMIT and usually find nothing. These events reach the
   * dispatcher on the next poll instead — none of them are on the realtime
   * path, so the extra latency is acceptable. Nudging correctly would require
   * a post-commit hook the TransactionPort does not currently expose.
   */
  async publishWithTransaction<T extends EventType>(
    tx: DatabaseTx,
    input: StrictlyTypedEventInput<T>,
  ): Promise<string> {
    const eventId = generateId(IdPrefixes.OUTBOX_EVENT);
    const correlationId = input.correlationId || generateId('corr');
    const envelope = this.createEnvelope(input, eventId, correlationId);

    await this.outbox.enqueueTx(
      {
        id: eventId,
        eventType: input.eventType,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        eventVersion: 1,
        payload: input.payload,
        metadata: this.withEnvelopeMetadata(
          {
            correlationId,
            causationId: input.causationId,
            userId: input.userId,
            timestamp: new Date(),
            version: 1,
            source: this.context,
          },
          envelope,
        ),
        correlationId: correlationId ?? null,
        status: 'PENDING',
        maxAttempts: 5,
        partitionKey: input.aggregateId, // Use explicit key or default to aggregateId
      },
      tx,
    );

    return eventId;
  }

  private createEnvelope<T extends EventType>(
    input: StrictlyTypedEventInput<T>,
    eventId: string,
    correlationId: string,
  ): WorkspaceEvent<AllEventsMap[T]> {
    const actor: WorkspaceEventActor = this.contextService?.isInContext()
      ? this.contextService.getActor()
      : { type: input.userId ? 'user' : 'system', userId: input.userId };

    const trace: WorkspaceEventTrace = this.contextService?.isInContext()
      ? { ...this.contextService.getTrace(), correlationId }
      : { requestId: correlationId, correlationId };

    return createEvent<AllEventsMap[T]>(
      input.eventType,
      input.payload,
      {
        eventId,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        actor,
        trace,
        causationId: input.causationId,
      },
      1,
    );
  }

  private withEnvelopeMetadata<T>(
    metadata: unknown,
    envelope: WorkspaceEvent<T>,
  ): Record<string, unknown> {
    const base =
      typeof metadata === 'object' && metadata !== null
        ? (metadata as Record<string, unknown>)
        : {};

    return {
      ...base,
      correlationId: envelope.trace.correlationId,
      causationId: envelope.causationId,
      userId: envelope.actor.userId,
      workspaceEvent: {
        schemaVersion: envelope.schemaVersion,
        occurredAt: envelope.occurredAt,
        enqueuedAt: envelope.enqueuedAt,
        actor: envelope.actor,
        trace: envelope.trace,
        causationId: envelope.causationId,
        retryCount: envelope.retryCount,
      },
    };
  }
}
