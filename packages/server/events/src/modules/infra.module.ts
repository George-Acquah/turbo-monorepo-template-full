import {
  EVENT_PUBLISHER_TOKEN,
  SAGA_ORCHESTRATOR_TOKEN,
} from '@repo/ports';
import { Global, Module } from '@nestjs/common';
// import { QueueModule } from '@repo/queue';
// import { eventProducerQueueConfigs } from '../constants/queue.config';
import { EventPublisherService } from '../services';
import { SagaOrchestrator } from '../sagas';

@Global()
@Module({
  // imports: [QueueModule.registerQueues(eventProducerQueueConfigs)],
  providers: [
    EventPublisherService,
    SagaOrchestrator,
    {
      provide: SAGA_ORCHESTRATOR_TOKEN,
      useExisting: SagaOrchestrator,
    },

    {
      provide: EVENT_PUBLISHER_TOKEN,
      useExisting: EventPublisherService,
    },
  ],
  exports: [EVENT_PUBLISHER_TOKEN, SAGA_ORCHESTRATOR_TOKEN],
})
export class EventsInfrastructureModule {}
