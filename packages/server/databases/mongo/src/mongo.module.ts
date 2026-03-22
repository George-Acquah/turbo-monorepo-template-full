import { Global, Module } from '@nestjs/common';
import { MONGO_RUNTIME_CONFIG_TOKEN, type MongoRuntimeConfig } from '@repo/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MONGO_TRANSACTION_PORT_TOKEN } from '@repo/ports';
import { MongoTransactionAdapter } from './mongo-transaction.adapter';
import { mongoDbClientProvider } from './mongo-db-client.provider';
import { MongoService } from './mongo.service';
import { EventsModelsModule, UsersModelsModule } from './modules';
import { MONGO_CONNECTION_NAME, MONGO_DB_CLIENT_TOKEN } from './tokens/mongo.tokens';

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
    UsersModelsModule,
    EventsModelsModule,
  ],
  providers: [
    mongoDbClientProvider,
    MongoService,
    MongoTransactionAdapter,
    {
      provide: MONGO_TRANSACTION_PORT_TOKEN,
      useExisting: MongoTransactionAdapter,
    },
  ],
  exports: [MONGO_DB_CLIENT_TOKEN, MongoService, MONGO_TRANSACTION_PORT_TOKEN],
})
export class MongoModule {}
