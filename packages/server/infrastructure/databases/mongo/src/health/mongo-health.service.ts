import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { DATABASE_HEALTH_TOKEN, type DatabaseHealthPort } from '@workspace/ports';
import type { DatabaseClient } from '@workspace/ports/database-client';
import { MONGO_CONNECTION_NAME } from '../client/mongo.tokens';

@Injectable()
export class MongoHealthService implements DatabaseClient, OnModuleInit {
  readonly name = 'mongo';

  constructor(
    @InjectConnection(MONGO_CONNECTION_NAME) private readonly connection: Connection,
    @Inject(DATABASE_HEALTH_TOKEN) private readonly health: DatabaseHealthPort,
  ) {}

  onModuleInit(): void {
    this.health.register(this);
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.connection.db?.admin().ping();
      return result?.ok === 1;
    } catch {
      return false;
    }
  }
}
