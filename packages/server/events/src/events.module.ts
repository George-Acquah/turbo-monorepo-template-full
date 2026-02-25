/**
 * Events Module
 * Central event processing module - orchestrates all event processors, sagas, and publishers
 * This module should only be imported by the main app.module
 */

import { Module } from '@nestjs/common';

// Infrastructure packages
// import { EventsQueueDefinitions } from '@repo/constants';
import { EventsInfrastructureModule } from './modules/infra.module';
import { EventsProcessingModule } from './modules/processing.module';

// const queueConfigs = Object.values(EventsQueueDefinitions).map((definition) => ({
//   name: definition.name,
//   defaultJobOptions: definition.options,
//   ...('limiter' in definition && definition.limiter ? { limiter: definition.limiter } : {}),
// })) as QueueConfig[];

@Module({
  imports: [
    /**
     * IMPORTANT: Use PartitionedQueueModule instead of QueueModule.registerQueues
     *
     * This module:
     * 1. Registers standard queues normally
     * 2. Sets up partitioned queue infrastructure for high-throughput queues
     * 3. Uses the SAME Redis connection for everything
     *
     * Partitioned queues (configured in partitioned-queue.module.ts):
     * - dashboard_events
     * - notification_events
     * - audit_events
     *
     * All other queues remain standard (non-partitioned)
     */
    // PartitionedQueueModule.registerPartitionedQueues(queueConfigs),
    EventsInfrastructureModule,
    EventsProcessingModule,
  ],
  exports: [],
})
export class EventsModule {}
