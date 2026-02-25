import { Module } from '@nestjs/common';
import { DomainEventProcessor } from '../processors/domain-event.processor';
import { OutboxProcessor } from '../processors/outbox.processor';
import { OutboxSchedulerService } from '../services/outbox-scheduler.service';

@Module({
  providers: [DomainEventProcessor, OutboxProcessor, OutboxSchedulerService],
})
export class EventsProcessingModule {}
