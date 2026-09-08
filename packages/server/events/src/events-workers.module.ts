import { Module } from '@nestjs/common';
import { EventsProcessingModule } from './modules/processing.module';

@Module({
  imports: [EventsProcessingModule],
})
export class EventsWorkersModule {}
