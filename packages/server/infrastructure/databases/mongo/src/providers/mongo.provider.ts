import type { MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import type { MongoRuntimeConfig } from '@workspace/ports/config';

/**
 * Build the Mongoose connection options from validated runtime config
 * (@workspace/config binds MongoRuntimeConfig to MONGO_RUNTIME_CONFIG_TOKEN).
 */
export function buildMongooseOptions(cfg: MongoRuntimeConfig): MongooseModuleFactoryOptions {
  return {
    uri: cfg.uri,
    dbName: cfg.dbName,
    maxPoolSize: cfg.maxPoolSize,
    minPoolSize: cfg.minPoolSize,
    serverSelectionTimeoutMS: cfg.serverSelectionTimeoutMs,
    autoIndex: true, // build the declared indexes on connect (dev/staging)
  };
}
