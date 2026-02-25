import { Inject, Injectable } from '@nestjs/common';
import type { Connection } from 'mongoose';
import { type MongoDbClient } from './mongo-db-client.provider';
import { getMongoConnectionToken, MONGO_DB_CLIENT_TOKEN } from './tokens/mongo.tokens';

@Injectable()
export class MongoService {
  constructor(
    @Inject(MONGO_DB_CLIENT_TOKEN)
    private readonly models: MongoDbClient,
    @Inject(getMongoConnectionToken())
    private readonly connection: Connection,
  ) {}

  get db(): MongoDbClient {
    return this.models;
  }

  getConnection(): Connection {
    return this.connection;
  }
}
