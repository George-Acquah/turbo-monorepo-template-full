// Queue Module and Infrastructure
export { QueueModule } from './queue.module';
export { PartitioningModule } from './partitioning/partitioning.module';

// Base processors
export * from './base/queue-processor.base';
export * from './base/domain-event-queue-processor.base';

// Consumer factories — the transport-agnostic surface. Modules build their
// queue consumers through these instead of importing BullMQ/@nestjs/bullmq
// symbols directly, so `bullmq`/`@nestjs/bullmq` imports stay confined to
// this package. Swapping the transport later means writing a new factory
// here, not touching every module.
export * from './factories';

export * from './scheduler';

// Types
export type { QueueConfig } from './interfaces/queue.interface';
