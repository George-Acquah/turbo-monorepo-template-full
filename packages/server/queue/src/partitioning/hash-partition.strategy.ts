import { Inject, Injectable } from '@nestjs/common';

import type { PartitionContext, PartitionedQueueConfig } from '@repo/types';
import { PARTITIONED_QUEUE_CONFIG_TOKEN, PartitionStrategyPort } from '@repo/ports';

@Injectable()
export class HashPartitionStrategy implements PartitionStrategyPort {
  constructor(
    @Inject(PARTITIONED_QUEUE_CONFIG_TOKEN)
    private readonly config: Record<string, PartitionedQueueConfig>,
  ) {}

  isPartitioned(baseQueueName: string): boolean {
    return this.config[baseQueueName]?.enabled ?? false;
  }

  consumeFromBaseQueue(baseQueueName: string): boolean {
    return this.config[baseQueueName]?.consumeFromBaseQueue ?? false;
  }

  getConfig(baseQueueName: string): PartitionedQueueConfig | undefined {
    return this.config[baseQueueName];
  }

  getPartitionKey(baseQueueName: string, ctx: PartitionContext): string {
    const cfg = this.config[baseQueueName];
    if (!cfg?.enabled) return 'default';

    if (cfg.partitionStrategy !== 'hash-based') return 'default';

    const partitions = cfg.maxPartitions ?? 100;

    const key = (ctx.key ?? ctx.tenantId ?? ctx.userId ?? 'global') || 'global';
    const partition = this.hashPartition(String(key), partitions);
    return `partition_${partition}`;
  }

  private hashPartition(key: string, partitionCount: number): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0; // force 32-bit int
    }
    return Math.abs(hash) % partitionCount;
  }
}
