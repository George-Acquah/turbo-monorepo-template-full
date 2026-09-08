import { Inject, Injectable, type Type } from '@nestjs/common';
import { Processor } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import type { IdempotencyConfig } from '@workspace/types';
import type { QueueJobProcessor } from '@workspace/ports';
import { QueueProcessor } from '../base/queue-processor.base';
import type { ConsumerOptions } from './domain-event-consumer.factory';

export type { ConsumerOptions };

// Re-exported for back-compat — existing consumers (e.g.
// packages/server/events' dispatch services) import this from
// '@workspace/queue'. Canonical definition now lives in '@workspace/ports'
// (queue-consumer-transport.port.ts), alongside the QueueConsumerTransport
// contract this factory implements (see ./bullmq-consumer-transport.ts).
export type { QueueJobProcessor };

/**
 * Builds a `@Processor`-decorated consumer for a single-service queue (the
 * generic sibling of `createDomainEventConsumer` for callers that aren't a
 * `WorkspaceEventHandlerPort[]` array — e.g. the outbox-drain dispatcher).
 * The injected `processorToken` only needs to implement `QueueJobProcessor`;
 * it never imports anything BullMQ-flavored.
 */
export function createQueueConsumer<T>(
  queueName: string,
  processorToken: Type<QueueJobProcessor<T>> | symbol | string,
  options: ConsumerOptions = {},
): Type<QueueProcessor<T>> {
  @Injectable()
  @Processor(queueName, { concurrency: options.concurrency ?? 1 })
  class GeneratedQueueConsumer extends QueueProcessor<T> {
    constructor(@Inject(processorToken) private readonly target: QueueJobProcessor<T>) {
      super(queueName);
    }

    protected override getIdempotencyConfig(job: Job<T>): IdempotencyConfig | undefined {
      return this.target.getIdempotencyConfig?.(job.data);
    }

    protected async handle(job: Job<T>): Promise<void> {
      await this.target.process(job.data);
    }
  }

  Object.defineProperty(GeneratedQueueConsumer, 'name', {
    value: `QueueConsumer_${queueName}`,
  });

  return GeneratedQueueConsumer;
}
