import { QueueConfig } from '@repo/queue';

import { eventWorkerQueueConfigs } from '@repo/events';

/**
 * Worker Queue Configuration
 *
 * Same queue set as the API — both API (producers) and Worker (consumers)
 * need queues registered so that @InjectQueue() and @Processor() resolve.
 */
export const ALL_WORKER_QUEUE_CONFIGS: QueueConfig[] = [...eventWorkerQueueConfigs];
