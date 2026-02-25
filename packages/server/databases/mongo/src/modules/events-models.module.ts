import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EVENTS_MODEL_DEFINITIONS } from '../schemas';
import { MONGO_CONNECTION_NAME } from '../tokens/mongo.tokens';

const eventsModelsFeature = MONGO_CONNECTION_NAME
  ? MongooseModule.forFeature(EVENTS_MODEL_DEFINITIONS, MONGO_CONNECTION_NAME)
  : MongooseModule.forFeature(EVENTS_MODEL_DEFINITIONS);

@Module({
  imports: [eventsModelsFeature],
  exports: [MongooseModule],
})
export class EventsModelsModule {}
