import type { Provider } from '@nestjs/common';
import {
  OUTBOX_EVENT_REPOSITORY_TOKEN,
  PRISMA_OUTBOX_EVENT_REPOSITORY_TOKEN,
  DEAD_LETTER_EVENT_REPOSITORY_TOKEN,
  PRISMA_DEAD_LETTER_EVENT_REPOSITORY_TOKEN,
  SAGA_STATE_REPOSITORY_TOKEN,
  PRISMA_SAGA_STATE_REPOSITORY_TOKEN,
  IDEMPOTENCY_KEY_REPOSITORY_TOKEN,
  PRISMA_IDEMPOTENCY_KEY_REPOSITORY_TOKEN,
} from '@workspace/ports';
import {
  PrismaOutboxEventAdapter,
  PrismaDeadLetterEventAdapter,
  PrismaSagaStateAdapter,
  PrismaIdempotencyKeyAdapter,
} from '../adapters';

export const OUTBOX_PERSISTENCE_ADAPTERS: Provider[] = [
  PrismaOutboxEventAdapter,
  { provide: PRISMA_OUTBOX_EVENT_REPOSITORY_TOKEN, useExisting: PrismaOutboxEventAdapter },
  { provide: OUTBOX_EVENT_REPOSITORY_TOKEN, useExisting: PrismaOutboxEventAdapter },

  PrismaDeadLetterEventAdapter,
  {
    provide: PRISMA_DEAD_LETTER_EVENT_REPOSITORY_TOKEN,
    useExisting: PrismaDeadLetterEventAdapter,
  },
  { provide: DEAD_LETTER_EVENT_REPOSITORY_TOKEN, useExisting: PrismaDeadLetterEventAdapter },

  PrismaSagaStateAdapter,
  { provide: PRISMA_SAGA_STATE_REPOSITORY_TOKEN, useExisting: PrismaSagaStateAdapter },
  { provide: SAGA_STATE_REPOSITORY_TOKEN, useExisting: PrismaSagaStateAdapter },

  PrismaIdempotencyKeyAdapter,
  {
    provide: PRISMA_IDEMPOTENCY_KEY_REPOSITORY_TOKEN,
    useExisting: PrismaIdempotencyKeyAdapter,
  },
  { provide: IDEMPOTENCY_KEY_REPOSITORY_TOKEN, useExisting: PrismaIdempotencyKeyAdapter },
];

export const OUTBOX_PERSISTENCE_TOKENS = [
  OUTBOX_EVENT_REPOSITORY_TOKEN,
  DEAD_LETTER_EVENT_REPOSITORY_TOKEN,
  SAGA_STATE_REPOSITORY_TOKEN,
  IDEMPOTENCY_KEY_REPOSITORY_TOKEN,
];
