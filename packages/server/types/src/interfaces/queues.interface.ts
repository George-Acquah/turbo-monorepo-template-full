export type PartitionContext = {
  tenantId?: string | null;
  userId?: string | null;

  /**
   * Free-form key override (e.g. aggregateId) when you want stable sharding
   * unrelated to userId.
   */
  key?: string | null;
};

/**
 * Partitioned Queue Configuration (per base queue)
 */
export interface PartitionedQueueConfig {
  baseQueueName: string;

  /**
   * For the template we support hash-based sharding.
   * You can extend later with per-tenant, per-aggregate, custom fn, etc.
   */
  partitionStrategy: 'hash-based';

  /**
   * If enabled, partition key will be computed and jobs go to `${base}:${partitionKey}`
   */
  enabled: boolean;

  /**
   * For hash-based partitioning
   */
  maxPartitions?: number;

  /**
   * Optional policy: always publish to base queue even if partitioning is enabled.
   * Useful when a module’s consumers are pinned to a base queue only.
   */
  consumeFromBaseQueue?: boolean;
}
