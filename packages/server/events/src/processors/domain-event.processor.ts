import { Inject, Injectable, Optional } from '@nestjs/common';
import { DefaultJobOptions, QueueNames } from '@repo/constants';
import {
  PARTITION_STRATEGY_TOKEN,
  QUEUE_BUS_TOKEN,
  PartitionStrategyPort,
  QueueBusPort,
} from '@repo/ports';
import {
  type DomainEventEnvelope,
  type JobsOptions,
  Processor,
  RouterQueueProcessor,
} from '@repo/queue';
import { EVENT_ROUTE_MAP } from '../constants/routing.constants';

@Injectable()
@Processor(QueueNames.DOMAIN_EVENTS)
export class DomainEventProcessor extends RouterQueueProcessor {
  protected readonly routeMap = EVENT_ROUTE_MAP;

  constructor(
    @Inject(QUEUE_BUS_TOKEN)
    protected readonly bus: QueueBusPort,
    @Optional()
    @Inject(PARTITION_STRATEGY_TOKEN)
    protected readonly partitioning?: PartitionStrategyPort,
  ) {
    super(DomainEventProcessor.name);
  }

  protected getJobOptions(
    queueName: string,
    event: DomainEventEnvelope<unknown>,
    partitionKey?: string,
  ): JobsOptions {
    const baseOptions =
      queueName === QueueNames.PAYMENT_EVENTS
        ? DefaultJobOptions.CRITICAL
        : DefaultJobOptions.STANDARD;

    return {
      ...baseOptions,
      ...super.getJobOptions(queueName, event, partitionKey),
    };
  }

  protected async onNoRoutes(event: { eventType: string }): Promise<void> {
    this.logger.warn(`No target queues for event: ${event.eventType}`, this.context);
  }
}
