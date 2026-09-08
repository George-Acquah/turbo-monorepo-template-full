import { Module } from '@nestjs/common';
import { EventsPublisherModule } from './modules/publisher.module';

/**
 * EventsModule — re-exports EventsPublisherModule for API/non-worker apps.
 *
 * API servers import this to get EventPublisherPort and SagaOrchestratorPort.
 * Worker processes import EventsWorkersModule instead, which brings in the
 * processors and scheduler on top of the publisher.
 */
@Module({
  imports: [EventsPublisherModule],
  exports: [EventsPublisherModule],
})
export class EventsModule {}
