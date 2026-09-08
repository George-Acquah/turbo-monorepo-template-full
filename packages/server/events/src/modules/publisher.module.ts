import { EVENT_PUBLISHER_TOKEN } from '@workspace/ports';
import { Global, Module } from '@nestjs/common';
import { EventPublisherService } from '../services';
import { SagaModule } from './saga.module';
import { QueueModule } from '@workspace/queue'; // Adjust import path if necessary
import { QueueNames } from '@workspace/constants';

/**
 * EventsPublisherModule — global publishing infrastructure.
 *
 * Provides EventPublisherPort to the entire app without requiring explicit
 * imports in each domain module.
 *
 * Imports SagaModule so that SAGA_ORCHESTRATOR_TOKEN remains available to
 * anything that imports EventsPublisherModule — preserving backward
 * compatibility without EventsPublisherModule owning saga concerns itself.
 *
 * Does NOT include processors, schedulers, or queue registrations — those
 * live in EventsProcessingModule (workers only).
 */
@Global()
@Module({
  imports: [
    SagaModule,
    // Use your custom QueueModule to register the required queue
    QueueModule.registerQueues([{ name: QueueNames.DOMAIN_EVENTS }]),
  ],
  providers: [
    EventPublisherService,
    {
      provide: EVENT_PUBLISHER_TOKEN,
      useExisting: EventPublisherService,
    },
  ],
  exports: [EVENT_PUBLISHER_TOKEN, SagaModule],
})
export class EventsPublisherModule {}
