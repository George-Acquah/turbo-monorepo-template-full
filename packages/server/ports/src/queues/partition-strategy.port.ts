import type { PartitionContext, PartitionedQueueConfig } from '@repo/types';

export abstract class PartitionStrategyPort {
  abstract isPartitioned(baseQueueName: string): boolean;

  /**
   * Returns 'default' if not partitioned or config disabled.
   * Returns a partition key string if partitioning applies.
   */
  abstract getPartitionKey(baseQueueName: string, ctx: PartitionContext): string;

  /**
   * Policy hook: if true, even if partitioning is enabled, publish to base queue.
   */
  abstract consumeFromBaseQueue(baseQueueName: string): boolean;

  /**
   * Optional: expose config for inspection
   */
  abstract getConfig(baseQueueName: string): PartitionedQueueConfig | undefined;
}

export const PARTITION_STRATEGY_TOKEN = Symbol('PARTITION_STRATEGY_TOKEN');
export const PARTITIONED_QUEUE_CONFIG_TOKEN = Symbol('PARTITIONED_QUEUE_CONFIG_TOKEN');
