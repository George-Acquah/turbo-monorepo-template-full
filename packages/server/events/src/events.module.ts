import { Module } from '@nestjs/common';
import { EventsInfrastructureModule } from './modules/infra.module';

@Module({
  imports: [EventsInfrastructureModule],
  exports: [EventsInfrastructureModule],
})
export class EventsModule {}
