import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseCoreModule } from '@workspace/databases-core';
import { MONGO_RUNTIME_CONFIG_TOKEN, type MongoRuntimeConfig } from '@workspace/ports/config';
import { MONGO_CONNECTION_NAME } from '../client/mongo.tokens';
import { MongoHealthService } from '../health';
import { buildMongooseOptions } from '../providers/mongo.provider';
import { MONGO_MODELS } from '../schemas';

// forFeature registers the document models on the named Workspace connection.
// Re-exported so importing modules (adapters) can @InjectModel(...) them.
const MongoFeatureModule = MongooseModule.forFeature(MONGO_MODELS, MONGO_CONNECTION_NAME);

/**
 * MongoModule — opens the named Workspace Mongo connection from validated
 * runtime config (relies on the global @workspace/config module providing
 * MONGO_RUNTIME_CONFIG_TOKEN) and registers the document models.
 *
 * Holds the high-volume, document-shaped records: notification instances,
 * per-channel delivery logs, the in-app feed, and search read-models.
 */
@Global()
@Module({
  imports: [
    DatabaseCoreModule,
    MongooseModule.forRootAsync({
      connectionName: MONGO_CONNECTION_NAME,
      inject: [MONGO_RUNTIME_CONFIG_TOKEN],
      useFactory: (cfg: MongoRuntimeConfig) => buildMongooseOptions(cfg),
    }),
    MongoFeatureModule,
  ],
  providers: [MongoHealthService],
  exports: [MongoFeatureModule],
})
export class MongoModule {}
