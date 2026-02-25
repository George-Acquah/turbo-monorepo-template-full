import { Injectable, OnModuleDestroy, OnModuleInit, Optional, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import mongoose, { Connection } from 'mongoose';
import { PROMETHEUS_PORT_TOKEN, PrometheusPort } from '@repo/ports';
import { mongoConfig } from './config/mongo.config';
import { createEventModels, createUserModels, EventModels, UserModels } from './schemas';

export interface MongoDbClient {
  users: UserModels;
  events: EventModels;
}

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private connection?: Connection;
  private models?: MongoDbClient;

  constructor(
    @Inject(mongoConfig.KEY)
    private readonly cfg: ConfigType<typeof mongoConfig>,
    @Optional() @Inject(PROMETHEUS_PORT_TOKEN) private readonly prometheus?: PrometheusPort,
  ) {}

  async onModuleInit() {
    if (!this.cfg.uri) {
      throw new Error('Mongo connection URI is missing. Set MONGODB_URI or MONGO_URI.');
    }

    const startedAt = Date.now();

    this.connection = await mongoose
      .createConnection(this.cfg.uri, {
        dbName: this.cfg.dbName,
        maxPoolSize: this.cfg.maxPoolSize,
        minPoolSize: this.cfg.minPoolSize,
        serverSelectionTimeoutMS: this.cfg.serverSelectionTimeoutMs,
      })
      .asPromise();

    this.models = {
      users: createUserModels(this.connection),
      events: createEventModels(this.connection),
    };

    this.prometheus?.recordDatabaseQuery('connect', 'mongo', (Date.now() - startedAt) / 1000);
  }

  async onModuleDestroy() {
    if (!this.connection) return;

    const startedAt = Date.now();
    await this.connection.close();
    this.prometheus?.recordDatabaseQuery('disconnect', 'mongo', (Date.now() - startedAt) / 1000);
  }

  get db(): MongoDbClient {
    if (!this.models) {
      throw new Error('MongoService has not been initialized yet.');
    }

    return this.models;
  }

  getConnection(): Connection {
    if (!this.connection) {
      throw new Error('Mongo connection has not been initialized yet.');
    }

    return this.connection;
  }
}
