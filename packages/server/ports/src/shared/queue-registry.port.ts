/**
 * Registry for managing partitioned queues dynamically
 *
 * Manages queue lifecycle and worker assignment
 */
export abstract class PartitionedQueueRegistryPort {
  /**
   * Get or create a partitioned queue
   * Uses EXISTING Redis connection (shared with all other queues)
   */
  abstract getOrCreateQueue<T>(baseQueueName: string, partitionKey: string): Promise<T>;

  /**
   * Get or create a worker for a partitioned queue
   */
  abstract getOrCreateWorker(
    baseQueueName: string,
    partitionKey: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processor: (job: any) => Promise<any>,
    concurrency: number,
  ): Promise<unknown>;

  /**
   * Get partition key for an event
   */
  abstract getPartitionKey(
    baseQueueName: string,
    companyId?: string | null,
    userId?: string | null,
  ): string;

  /**
   * Check if a queue should use partitioning
   */
  abstract isPartitioned(baseQueueName: string): boolean;

  /**
   * Get all partitioned queues currently in registry
   */
  abstract getActivePartitions(): string[];

  /**
   * Get statistics
   */
  abstract getStatistics(): {
    totalQueues: number;
    totalWorkers: number;
    partitionsByBase: Record<string, number>;
  };
}

export const PARTITIONED_QUEUE_REGISTRY_TOKEN = Symbol('PARTITIONED_QUEUE_REGISTRY_TOKEN');
