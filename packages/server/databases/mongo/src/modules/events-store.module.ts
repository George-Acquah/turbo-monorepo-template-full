import { Global, Module } from '@nestjs/common';
import { IDEMPOTENCY_TOKEN, OUTBOX_TOKEN, SAGA_STATE_TOKEN } from '@repo/ports';
import { MongoIdempotencyAdapter, MongoOutboxAdapter, MongoSagaStateAdapter } from '../adapters/events';

@Global()
@Module({
  providers: [
    MongoOutboxAdapter,
    MongoIdempotencyAdapter,
    MongoSagaStateAdapter,
    { provide: OUTBOX_TOKEN, useExisting: MongoOutboxAdapter },
    { provide: IDEMPOTENCY_TOKEN, useExisting: MongoIdempotencyAdapter },
    { provide: SAGA_STATE_TOKEN, useExisting: MongoSagaStateAdapter },
  ],
  exports: [OUTBOX_TOKEN, IDEMPOTENCY_TOKEN, SAGA_STATE_TOKEN],
})
export class MongoEventsStoreModule {}
