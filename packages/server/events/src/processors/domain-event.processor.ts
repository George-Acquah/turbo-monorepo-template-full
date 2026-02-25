/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnModuleDestroy, Inject } from '@nestjs/common';
import { QueueNames, JobNames, DefaultJobOptions } from '@repo/constants';
import { DomainEvent } from '@repo/types';
import { InjectQueue, Job, OnQueueEvent, Processor, Queue } from '@repo/queue';

import { PARTITIONED_QUEUE_REGISTRY_TOKEN, PartitionedQueueRegistryPort } from '@repo/ports';

import { EVENT_ROUTE_MAP } from '../constants/routing.constants';
import { QueueProcessor } from '@repo/queue';

@Injectable()
@Processor(QueueNames.DOMAIN_EVENTS)
export class DomainEventProcessor
  extends QueueProcessor<DomainEvent<unknown>>
  implements OnModuleDestroy
{
  private readonly queueMap = new Map<string, Queue>();

  constructor(
    @InjectQueue(QueueNames.DOMAIN_EVENTS) private readonly domainEventsQueue: Queue,
    @Inject(PARTITIONED_QUEUE_REGISTRY_TOKEN)
    private readonly partitionedRegistry: PartitionedQueueRegistryPort,
  ) {
    super(DomainEventProcessor.name);
  }

  protected async handle(job: Job<DomainEvent<unknown>>): Promise<void> {
    const { eventType, eventId } = job.data;

    const targetQueues = this.resolveTargetQueues(eventType);
    if (targetQueues.length === 0) {
      this.logger.warn(`No target queues for event: ${eventType}`, this.context);
      return;
    }

    await Promise.all(targetQueues.map((q) => this.routeToQueue(q, job.data, eventId)));
  }

  private async routeToQueue(
    queueName: string,
    event: DomainEvent<unknown>,
    eventId: string,
  ): Promise<void> {
    // Notifications are consumed from the base queue by NotificationsModule workers.
    if (queueName === QueueNames.NOTIFICATION_EVENTS) {
      return this.routeToStandardQueue(queueName, event, eventId);
    }

    if (this.partitionedRegistry.isPartitioned(queueName)) {
      return this.routeToPartitionedQueue(queueName, event, eventId);
    }

    return this.routeToStandardQueue(queueName, event, eventId);
  }

  private async routeToStandardQueue(
    queueName: string,
    event: DomainEvent<unknown>,
    eventId: string,
  ): Promise<void> {
    const queue = this.getOrCreateStandardQueue(queueName);

    await queue.add(JobNames.PROCESS_DOMAIN_EVENT, event, {
      ...this.getOptionsForQueue(queueName),
      jobId: `${queueName}-${eventId}`,
    });
  }

  private async routeToPartitionedQueue(
    baseQueueName: string,
    event: DomainEvent<unknown>,
    eventId: string,
  ): Promise<void> {
    const tenantId = (event.payload as any)?.tenantId as string | undefined;
    const userId = event.metadata?.userId;
    const aggregateId = event.aggregateId;

    const partitionInput = tenantId ?? userId ?? aggregateId;
    const partitionKey = this.partitionedRegistry.getPartitionKey(baseQueueName, partitionInput);

    const queue = await this.partitionedRegistry.getOrCreateQueue<Queue>(
      baseQueueName,
      partitionKey,
    );

    await queue.add(JobNames.PROCESS_DOMAIN_EVENT, event, {
      ...this.getOptionsForQueue(baseQueueName),
      jobId: `${baseQueueName}-${partitionKey}-${eventId}`,
    });

    this.logger.debug(
      `Routed event ${event.eventType} -> ${baseQueueName}:${partitionKey}`,
      this.context,
    );
  }

  private resolveTargetQueues(eventType: string): string[] {
    // exact first
    if (EVENT_ROUTE_MAP[eventType]) return EVENT_ROUTE_MAP[eventType];

    // wildcard fallbacks
    for (const [pattern, queues] of Object.entries(EVENT_ROUTE_MAP)) {
      if (!pattern.endsWith('*')) continue;
      const prefix = pattern.slice(0, -1);
      if (eventType.startsWith(prefix)) return queues;
    }
    return [];
  }

  private getOptionsForQueue(queueName: string): any {
    if (queueName === QueueNames.PAYMENT_EVENTS) return DefaultJobOptions.CRITICAL;
    return DefaultJobOptions.STANDARD;
  }

  private getOrCreateStandardQueue(queueName: string): Queue {
    const existing = this.queueMap.get(queueName);
    if (existing) return existing;

    const queue = new Queue(queueName, {
      connection: (this.domainEventsQueue as any).opts.connection,
    });

    this.queueMap.set(queueName, queue);
    return queue;
  }

  @OnQueueEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Domain event job failed [jobId=${job?.id}]: ${error.message}`,
      error.stack,
      this.context,
    );
  }

  async onModuleDestroy(): Promise<void> {
    const queues = Array.from(this.queueMap.values());
    await Promise.all(queues.map((q) => q.close()));
    this.queueMap.clear();
  }
}
