import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TRANSACTION_PORT_TOKEN } from '@repo/ports';
import { mongoConfig } from './config/mongo.config';
import { MongoService } from './mongo.service';
import { MongoTransactionAdapter } from './mongo-transaction.adapter';

@Global()
@Module({
  imports: [ConfigModule.forFeature(mongoConfig)],
  providers: [
    MongoService,
    MongoTransactionAdapter,
    {
      provide: TRANSACTION_PORT_TOKEN,
      useExisting: MongoTransactionAdapter,
    },
  ],
  exports: [MongoService, TRANSACTION_PORT_TOKEN],
})
export class MongoModule {}
