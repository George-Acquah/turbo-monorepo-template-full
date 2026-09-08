import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { DeadLetterDispatchService } from '../services/dead-letter-dispatch.service';
import { DomainEventDispatchService } from '../services/domain-event-dispatch.service';
import { OutboxDispatchService } from '../services/outbox-dispatch.service';
import { OutboxSchedulerService } from '../services/outbox-scheduler.service';
import { EventsPublisherModule } from './publisher.module';
import { ROUTING_TABLE_TOKEN, type CompiledRoutingTable } from '@workspace/types';
import { QueueModule, createQueueConsumer } from '@workspace/queue';
import { QueueNames } from '@workspace/constants';
import { BindingRegistry } from '@/dispatch/binding.registry';
import { BullMqTransportAdapter } from '@/dispatch/bullmq-transport.adapter';
import { DispatchEngine } from '@/dispatch/dispatch.engine';
import { EventPartitionContextFactory } from '@/dispatch/event-partition-context.factory';

@Module({
  imports: [
    EventsPublisherModule,
    // DomainEventProcessor's DOMAIN_EVENTS queue is registered by
    // EventsPublisherModule. OutboxProcessor's queue has no producer-side
    // module to piggyback on, so it must be registered here directly, or
    // @nestjs/bullmq's explorer throws NO_QUEUE_FOUND for OutboxProcessor
    // at boot. DEAD_LETTER is in the same position: OutboxDispatchService
    // enqueues onto it, but nothing registered it until its consumer landed.
    QueueModule.registerQueues([
      { name: QueueNames.OUTBOX_PROCESSOR },
      { name: QueueNames.DEAD_LETTER },
    ]),
  ],
  providers: [
    EventPartitionContextFactory,
    DomainEventDispatchService,
    createQueueConsumer(QueueNames.DOMAIN_EVENTS, DomainEventDispatchService),
    OutboxDispatchService,
    createQueueConsumer(QueueNames.OUTBOX_PROCESSOR, OutboxDispatchService),
    DeadLetterDispatchService,
    createQueueConsumer(QueueNames.DEAD_LETTER, DeadLetterDispatchService),
    OutboxSchedulerService,
    DispatchEngine,
    BindingRegistry,
    BullMqTransportAdapter,
  ],
  exports: [DispatchEngine, BindingRegistry],
})
export class EventsProcessingModule implements OnModuleInit {
  constructor(
    private readonly bindingRegistry: BindingRegistry,
    private readonly bullMqAdapter: BullMqTransportAdapter,
    @Inject(ROUTING_TABLE_TOKEN)
    private readonly routingTable: CompiledRoutingTable,
  ) {}

  onModuleInit() {
    // Automatically bind all compiled queues to the BullMQ adapter by default
    const uniqueQueues = new Set<string>();
    for (const route of this.routingTable.values()) {
      for (const q of route.queues) {
        uniqueQueues.add(q);
      }
    }

    for (const q of uniqueQueues) {
      this.bindingRegistry.register(q, this.bullMqAdapter);
    }
  }
}
