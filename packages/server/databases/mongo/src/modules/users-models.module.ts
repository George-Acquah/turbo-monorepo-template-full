import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { USERS_MODEL_DEFINITIONS } from '../schemas';
import { MONGO_CONNECTION_NAME } from '../tokens/mongo.tokens';

const usersModelsFeature = MONGO_CONNECTION_NAME
  ? MongooseModule.forFeature(USERS_MODEL_DEFINITIONS, MONGO_CONNECTION_NAME)
  : MongooseModule.forFeature(USERS_MODEL_DEFINITIONS);

@Module({
  imports: [usersModelsFeature],
  exports: [MongooseModule],
})
export class UsersModelsModule {}
