import { Inject, Injectable, type Type } from '@nestjs/common';
import { Processor } from '@nestjs/bullmq';
import type { WorkspaceEventHandlerPort } from '@workspace/ports';
import { DomainEventQueueProcessor } from '../base/domain-event-queue-processor.base';

/**
 * Options forwarded to the generated BullMQ worker.
 */
export interface ConsumerOptions {
  /**
   * How many jobs this worker processes in parallel. Omitted means BullMQ's
   * default of 1, i.e. strictly serial — which makes one slow handler
   * head-of-line-block its entire queue.
   *
   * Raising this on an I/O-bound queue is much cheaper than adding worker
   * replicas: every BullMQ worker duplicates its Redis connection for the
   * blocking poll, so replicas multiply connections while concurrency does
   * not. Note each in-flight job still consumes a database connection from
   * the Prisma pool, so keep the sum of concurrencies within `poolMax`.
   */
  concurrency?: number;
}

/**
 * Builds a `@Processor`-decorated consumer for a domain-event queue. Modules
 * register `createDomainEventConsumer(queueName, handlersToken)` as a
 * provider instead of hand-writing a class that imports `@Processor`/BullMQ
 * symbols themselves — that keeps `@nestjs/bullmq`/`bullmq` imports confined
 * to this package, so swapping the transport later never touches a module.
 */
export function createDomainEventConsumer(
  queueName: string,
  handlersToken: symbol | string,
  options: ConsumerOptions = {},
): Type<DomainEventQueueProcessor> {
  @Injectable()
  @Processor(queueName, { concurrency: options.concurrency ?? 1 })
  class GeneratedDomainEventConsumer extends DomainEventQueueProcessor {
    protected readonly scope = queueName;
    protected readonly handlers: WorkspaceEventHandlerPort[];

    constructor(@Inject(handlersToken) handlers: WorkspaceEventHandlerPort[]) {
      super(queueName);
      this.handlers = handlers;
    }
  }

  Object.defineProperty(GeneratedDomainEventConsumer, 'name', {
    value: `DomainEventConsumer_${queueName}`,
  });

  return GeneratedDomainEventConsumer;
}
