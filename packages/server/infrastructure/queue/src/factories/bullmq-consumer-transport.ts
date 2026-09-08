import type { QueueConsumerTransport } from '@workspace/ports';
import { createDomainEventConsumer } from './domain-event-consumer.factory';
import { createQueueConsumer } from './queue-consumer.factory';

/**
 * The BullMQ implementation of `QueueConsumerTransport` (`@workspace/ports`)
 * — the only implementation today. A future transport (e.g. RabbitMQ) is a
 * new package/module implementing the same interface; nothing that calls
 * `createDomainEventConsumer`/`createQueueConsumer` today needs to change.
 *
 * The `: QueueConsumerTransport` annotation is real enforcement — if either
 * factory's signature ever drifts from the contract, this fails to compile.
 */
export const bullMqConsumerTransport: QueueConsumerTransport = {
  createDomainEventConsumer,
  createQueueConsumer,
};
