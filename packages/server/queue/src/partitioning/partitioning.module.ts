import { DynamicModule, Global, Module } from '@nestjs/common';
import { PARTITIONED_QUEUE_CONFIG_TOKEN, PARTITION_STRATEGY_TOKEN } from '@repo/ports';
import { PartitionedQueueConfig } from '@repo/types';
import { HashPartitionStrategy } from './hash-partition.strategy';

@Global()
@Module({})
export class PartitioningModule {
  static register(config: Record<string, PartitionedQueueConfig>): DynamicModule {
    return {
      module: PartitioningModule,
      providers: [
        { provide: PARTITIONED_QUEUE_CONFIG_TOKEN, useValue: config },
        HashPartitionStrategy,
        { provide: PARTITION_STRATEGY_TOKEN, useExisting: HashPartitionStrategy },
      ],
      exports: [PARTITIONED_QUEUE_CONFIG_TOKEN, PARTITION_STRATEGY_TOKEN],
    };
  }
}
