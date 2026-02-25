/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Job, Processor, Queue } from '@repo/queue';

import { DefaultJobOptions, JobNames, QueueNames } from '@repo/constants';

import { OUTBOX_TOKEN, OutboxPort, METRICS_PORT_TOKEN, MetricsPort } from '@repo/ports';

import { QueueProcessor } from '@repo/queue';

const BATCH_SIZE = 100;
const MAX_RETRY_DELAY_MS = 300_000; // 5m
const BASE_RETRY_DELAY_MS = 1_000; // 1s

export interface OutboxBatchJob {
  batchId: string;
}

@Processor(QueueNames.OUTBOX_PROCESSOR)
@Injectable()
export class OutboxProcessor extends QueueProcessor<OutboxBatchJob> implements OnModuleInit {
  constructor(
    @InjectQueue(QueueNames.DOMAIN_EVENTS) private readonly eventQueue: Queue,
    @InjectQueue(QueueNames.DEAD_LETTER) private readonly dlqQueue: Queue,
    @Inject(OUTBOX_TOKEN) private readonly outbox: OutboxPort,
    @Inject(METRICS_PORT_TOKEN) private readonly metrics: MetricsPort,
  ) {
    super(OutboxProcessor.name);
  }

  async onModuleInit() {
    // Optional: warm start processing once on boot (not scheduling).
    await this.processPendingEvents();
  }

  protected async handle(_job: Job<OutboxBatchJob>): Promise<void> {
    await this.processPendingEvents();
  }

  private async processPendingEvents(): Promise<void> {
    const run = async () => {
      const events = await this.outbox.fetchPending(BATCH_SIZE);
      if (events.length === 0) return;

      this.logger.debug(`Processing ${events.length} outbox events`, this.context);

      for (const e of events) {
        await this.processOutboxEvent(e as any);
      }
    };

    if ((this.metrics as any)?.time) {
      await (this.metrics as any).time('outbox.poll.duration', undefined, run);
    } else {
      await run();
    }
  }

  private async processOutboxEvent(event: any): Promise<void> {
    try {
      await this.eventQueue.add(
        JobNames.PROCESS_DOMAIN_EVENT,
        {
          eventId: event.id,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload,
          metadata: {
            ...(event.metadata || {}),
            correlationId: event.correlationId ?? undefined,
            causationId: event.causationId ?? undefined,
          },
        },
        { ...DefaultJobOptions.STANDARD, jobId: event.id },
      );

      await this.outbox.markProcessed(event.id);
      (this.metrics as any)?.increment?.('outbox.events_processed', { status: 'success' });
    } catch (err) {
      (this.metrics as any)?.increment?.('outbox.events_processed', { status: 'failure' });
      await this.handleFailure(event, err instanceof Error ? err : new Error(String(err)));
    }
  }

  private async handleFailure(event: any, error: Error): Promise<void> {
    const attempts = Number(event.attempts ?? 0) + 1;
    const maxAttempts = Number(event.maxAttempts ?? 5);

    if (attempts >= maxAttempts) {
      await this.dlqQueue.add(
        JobNames.PROCESS_DLQ_EVENT,
        { eventId: event.id, eventType: event.eventType, error: error.message },
        DefaultJobOptions.BACKGROUND,
      );

      await this.outbox.markFailed(event.id, error.message, undefined);

      this.logger.error(
        `Outbox event dead-lettered [id=${event.id}, type=${event.eventType}] after ${attempts} attempts`,
        error.stack,
        this.context,
      );
      return;
    }

    const delay = Math.min(BASE_RETRY_DELAY_MS * 2 ** (attempts - 1), MAX_RETRY_DELAY_MS);
    const retryAt = new Date(Date.now() + delay);

    await this.outbox.markFailed(event.id, error.message, retryAt);

    this.logger.warn(
      `Outbox event failed [id=${event.id}, type=${event.eventType}] retry ${attempts}/${maxAttempts} at ${retryAt.toISOString()}`,
      this.context,
    );
  }
}
