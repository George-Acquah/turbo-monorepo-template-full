import type { IdempotencyConfig } from '@workspace/types';

/**
 * Minimal structural stand-in for Nest's `Type<T>` (`new (...args) => T`) —
 * declared locally rather than importing `@nestjs/common` so this package
 * stays framework-agnostic, matching every other port here.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export interface ClassType<T = unknown> extends Function {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T;
}

/**
 * A plain, transport-agnostic unit of work a queue consumer delegates to.
 * Implementations never see the underlying transport's job/message type —
 * only the job's `data`.
 */
export interface QueueJobProcessor<T> {
  process(data: T): Promise<void>;
  getIdempotencyConfig?(data: T): IdempotencyConfig | undefined;
}

/**
 * Contract a queue transport must satisfy to plug into event consumption.
 * BullMQ is the only implementation today (`@workspace/queue`'s
 * `bullMqConsumerTransport`, built from `createDomainEventConsumer`/
 * `createQueueConsumer`) — adding e.g. RabbitMQ means implementing this same
 * interface in a new package; `createDomainEventConsumer(...)`/
 * `createQueueConsumer(...)` call sites in modules never change.
 *
 * This mirrors `QueueBusPort` (the produce/dispatch-side port, `./queue-bus.port.ts`)
 * — the two together cover both halves of the event pipeline. Unlike
 * `QueueBusPort`, this isn't a DI-injectable abstract class: both methods are
 * consulted while building a `providers: [...]` array at module-composition
 * time, before any Nest injector exists, not via `@Inject()` at runtime.
 */
export interface QueueConsumerTransport {
  createDomainEventConsumer(queueName: string, handlersToken: symbol | string): ClassType;

  createQueueConsumer<T>(
    queueName: string,
    processorToken: ClassType<QueueJobProcessor<T>> | symbol | string,
  ): ClassType;
}
