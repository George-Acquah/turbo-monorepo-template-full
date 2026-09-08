// packages/server/events/src/mesh/bullmq-transport.adapter.ts
import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  PARTITION_STRATEGY_TOKEN,
  PartitionStrategyPort,
  QUEUE_BUS_TOKEN,
  QueueBusPort,
} from '@workspace/ports';
import { DomainEventEnvelope } from '@workspace/queue';
import { CompiledRoute, PartitionContext } from '@workspace/types';
import { DefaultJobOptions, JobNames } from '@workspace/constants';
import type { JobsOptions } from 'bullmq';

import { EventPartitionContextFactory } from './event-partition-context.factory';
import { DispatchTarget, TransportAdapter } from '@/mesh';

@Injectable()
export class BullMqTransportAdapter implements TransportAdapter {
  constructor(
    @Inject(QUEUE_BUS_TOKEN)
    private readonly bus: QueueBusPort,
    private readonly partitionContextFactory: EventPartitionContextFactory,
    @Optional()
    @Inject(PARTITION_STRATEGY_TOKEN)
    private readonly partitioning?: PartitionStrategyPort,
  ) {}

  async dispatch(target: DispatchTarget, event: DomainEventEnvelope<unknown>): Promise<void> {
    const queueName = target.queueName;
    const route = target.route;
    const jobName = JobNames.PROCESS_DOMAIN_EVENT;
    const partitionKey = this.resolvePartitionKey(queueName, event);
    const jobOptions = this.getJobOptions(queueName, event, route, partitionKey);

    if (partitionKey) {
      await this.bus.enqueuePartitioned(queueName, partitionKey, jobName, event, jobOptions);
      return;
    }

    await this.bus.enqueue(queueName, jobName, event, jobOptions);
  }

  async dispatchMany(
    targets: DispatchTarget[],
    event: DomainEventEnvelope<unknown>,
  ): Promise<void> {
    const results = await Promise.allSettled(targets.map((target) => this.dispatch(target, event)));

    const failures = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) =>
        result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
      );

    if (failures.length > 0) {
      throw new AggregateError(
        failures,
        `Failed dispatching event ${event.eventId} to ${failures.length} target(s)`,
      );
    }
  }

  private resolvePartitionKey(
    queueName: string,
    event: DomainEventEnvelope<unknown>,
  ): string | undefined {
    if (!this.partitioning?.isPartitioned(queueName)) return undefined;
    if (this.partitioning.consumeFromBaseQueue(queueName)) return undefined;

    const ctx: PartitionContext = this.partitionContextFactory.create(event);
    return this.partitioning.getPartitionKey(queueName, ctx);
  }

  private getJobOptions(
    queueName: string,
    event: DomainEventEnvelope<unknown>,
    route: CompiledRoute,
    partitionKey?: string,
  ): JobsOptions {
    const baseOptions =
      route.priority === 'critical'
        ? DefaultJobOptions.CRITICAL
        : route.priority === 'background'
          ? DefaultJobOptions.BACKGROUND
          : DefaultJobOptions.STANDARD;

    const baseId = event.eventId;
    const jobId = partitionKey
      ? `${queueName}-${partitionKey}-${baseId}`
      : `${queueName}-${baseId}`;

    return { ...baseOptions, jobId };
  }
}
