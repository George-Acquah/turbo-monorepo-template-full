import {
  EVENT_PUBLISHER_TOKEN,
  // IDEMPOTENCY_TOKEN,
  // SAGA_STATE_TOKEN,
  // OUTBOX_TOKEN,
  SAGA_ORCHESTRATOR_TOKEN,
} from '@repo/ports';
import { Global, Module } from '@nestjs/common';
import { EventPublisherService } from '../services';
import { SagaOrchestrator } from '../sagas';

@Global()
@Module({
  providers: [
    EventPublisherService,
    SagaOrchestrator,
    // PrismaIdempotencyAdapter,
    // PrismaSagaStateAdapter,
    // PrismaOutboxAdapter,
    {
      provide: SAGA_ORCHESTRATOR_TOKEN,
      useExisting: SagaOrchestrator,
    },

    {
      provide: EVENT_PUBLISHER_TOKEN,
      useExisting: EventPublisherService,
    },
    // {
    //   provide: IDEMPOTENCY_TOKEN,
    //   useExisting: PrismaIdempotencyAdapter,
    // },
    // {
    //   provide: SAGA_STATE_TOKEN,
    //   useExisting: PrismaSagaStateAdapter,
    // },
    // {
    //   provide: OUTBOX_TOKEN,
    //   useExisting: PrismaOutboxAdapter,
    // },
  ],
  exports: [
    // IDEMPOTENCY_TOKEN,
    // SAGA_STATE_TOKEN,
    // OUTBOX_TOKEN,
    EVENT_PUBLISHER_TOKEN,
    SAGA_ORCHESTRATOR_TOKEN,
  ],
})
export class EventsInfrastructureModule {}
