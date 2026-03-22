import { Global, Module } from '@nestjs/common';
import { MONGO_RUNTIME_CONFIG_TOKEN, type MongoRuntimeConfig } from '@repo/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MONGO_CONNECTION_NAME } from './tokens/mongo.tokens';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [MONGO_RUNTIME_CONFIG_TOKEN],
      useFactory: (cfg: MongoRuntimeConfig): MongooseModuleOptions => {
        if (!cfg.uri) {
          throw new Error('Mongo connection URI is missing. Set MONGODB_URI or MONGO_URI.');
        }

        const options: MongooseModuleOptions = {
          uri: cfg.uri,
          dbName: cfg.dbName,
          maxPoolSize: cfg.maxPoolSize,
          minPoolSize: cfg.minPoolSize,
          serverSelectionTimeoutMS: cfg.serverSelectionTimeoutMs,
          autoIndex: true,
          autoCreate: true,
        };

        if (MONGO_CONNECTION_NAME) {
          options.connectionName = MONGO_CONNECTION_NAME;
        }

        return options;
      },
    }),
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
