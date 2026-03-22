import { Module } from '@nestjs/common';
import { DomainEventProcessor } from '../processors/domain-event.processor';
import { OutboxProcessor } from '../processors/outbox.processor';
import { OutboxSchedulerService } from '../services/outbox-scheduler.service';
import { QUEUE_SCHEDULER_TOKEN } from '@repo/ports';
import { QueueSchedulerService } from '@repo/queue';

@Module({
  // imports: [QueueModule.registerQueues(eventWorkerQueueConfigs)],
  providers: [
    DomainEventProcessor,
    OutboxProcessor,
    OutboxSchedulerService,
    { provide: QUEUE_SCHEDULER_TOKEN, useExisting: QueueSchedulerService },
  ],
})
export class EventsProcessingModule {}
