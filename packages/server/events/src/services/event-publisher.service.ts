import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectQueue, Queue } from '@repo/queue';

import {
  DomainEventInput,
  EventPublisherPort,
  LOGGER_TOKEN,
  LoggerPort,
  METRICS_PORT_TOKEN,
  MetricsPort,
  OUTBOX_TOKEN,
  OutboxEventInput,
  OutboxPort,
  TRANSACTION_PORT_TOKEN,
  TransactionPort,
} from '@repo/ports';

import { DefaultJobOptions, IdPrefixes, JobNames, QueueNames } from '@repo/constants';
import { DomainEvent, DomainEventMetadata, PublishOptions } from '@repo/types';
import { generateId } from '@repo/utils';

@Injectable()
export class EventPublisherService implements EventPublisherPort {
  private readonly context = EventPublisherService.name;

  constructor(
    @InjectQueue(QueueNames.DOMAIN_EVENTS) private readonly eventQueue: Queue,
    @Inject(OUTBOX_TOKEN) private readonly outbox: OutboxPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly tx: TransactionPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Optional() @Inject(METRICS_PORT_TOKEN) private readonly metrics?: MetricsPort,
  ) {}

  async publish<T = unknown>(
    input: OutboxEventInput<T>,
    _options: PublishOptions = {},
  ): Promise<string> {
    const eventId = generateId(IdPrefixes.OUTBOX_EVENT);
    const correlationId = input.correlationId || generateId('corr');

    const write = async () =>
      this.tx.execute(async (trx) => {
        await this.outbox.enqueueTx(
          {
            id: eventId,
            eventType: input.eventType,
            aggregateType: input.aggregateType,
            aggregateId: input.aggregateId,
            payload: input.payload,
            metadata: input.metadata,
            correlationId: correlationId ?? null,
            status: 'PENDING',
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

    return eventId;
  }

  async publishBatch<T = unknown>(events: OutboxEventInput<T>[]): Promise<string[]> {
    if (events.length === 0) return [];

    const correlationId = events[0]?.correlationId || generateId('corr');
    const ids: string[] = [];

    const write = async () =>
      this.tx.execute(async (trx) => {
        for (const e of events) {
          const eventId = generateId(IdPrefixes.OUTBOX_EVENT);
          ids.push(eventId);

          await this.outbox.enqueueTx(
            {
              id: eventId,
              eventType: e.eventType,
              aggregateType: e.aggregateType,
              aggregateId: e.aggregateId,
              payload: e.payload,
              metadata: e.metadata,
              correlationId: (e.correlationId || correlationId) ?? null,
              status: 'PENDING',
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
    return ids;
  }

  async publishDirect<T extends Record<string, unknown>>(
    input: DomainEventInput<T>,
    options: PublishOptions = {},
  ): Promise<string> {
    const eventId = generateId(IdPrefixes.OUTBOX_EVENT);
    const correlationId = input.correlationId || generateId('corr');

    const metadata: DomainEventMetadata = {
      correlationId,
      causationId: input.causationId,
      userId: input.userId,
      timestamp: new Date(),
      version: 1,
      source: this.context,
    };

    const event: DomainEvent<T> = {
      eventId,
      eventType: input.eventType,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payload: input.payload,
      metadata,
    };

    const write = async () =>
      this.eventQueue.add(JobNames.PROCESS_DOMAIN_EVENT, event, {
        ...DefaultJobOptions.STANDARD,
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

  async publishWithTransaction<T extends Record<string, unknown>, S = unknown>(
    tx: S,
    input: DomainEventInput<T>,
  ): Promise<string> {
    const eventId = generateId(IdPrefixes.OUTBOX_EVENT);
    const correlationId = input.correlationId || generateId('corr');

    await this.outbox.enqueueTx(
      {
        id: eventId,
        eventType: input.eventType,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        payload: input.payload,
        metadata: {
          correlationId,
          causationId: input.causationId,
          userId: input.userId,
          timestamp: new Date(),
          version: 1,
          source: this.context,
        },
        correlationId: correlationId ?? null,
        status: 'PENDING',
      },
      tx,
    );

    return eventId;
  }
}
