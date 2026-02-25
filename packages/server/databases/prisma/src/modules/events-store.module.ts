import { Global, Module } from '@nestjs/common';
import { OUTBOX_TOKEN, IDEMPOTENCY_TOKEN, SAGA_STATE_TOKEN } from '@repo/ports';
import {
  PrismaIdempotencyAdapter,
  PrismaOutboxAdapter,
  PrismaSagaStateAdapter,
} from '../adapters/events';

@Global()
@Module({
  providers: [
    PrismaOutboxAdapter,
    PrismaIdempotencyAdapter,
    PrismaSagaStateAdapter,

    { provide: OUTBOX_TOKEN, useExisting: PrismaOutboxAdapter },
    { provide: IDEMPOTENCY_TOKEN, useExisting: PrismaIdempotencyAdapter },
    { provide: SAGA_STATE_TOKEN, useExisting: PrismaSagaStateAdapter },
  ],
  exports: [OUTBOX_TOKEN, IDEMPOTENCY_TOKEN, SAGA_STATE_TOKEN],
})
export class PrismaEventsStoreModule {}
