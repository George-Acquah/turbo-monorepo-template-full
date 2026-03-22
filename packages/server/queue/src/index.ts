// Queue Module and Infrastructure
export { QueueModule } from './queue.module';
export { PartitioningModule } from './partitioning/partitioning.module';

// Base processors
export * from './base/queue-processor.base';
export * from './base/domain-event-queue-processor.base';
export * from './base/router-processor.base';

export * from './scheduler';

// Types
export type { QueueConfig } from './interfaces/queue.interface';

// Convenience re-exports (BullMQ + Nest BullMQ)
export { Queue, Job, Worker, type JobsOptions, type RateLimiterOptions } from 'bullmq';
export { InjectQueue, Processor, WorkerHost, OnQueueEvent } from '@nestjs/bullmq';
