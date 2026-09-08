import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@workspace/prisma';
import {
  OutboxEventQuery,
  DeadLetterEventQuery,
  SagaStateQuery,
  IdempotencyKeyQuery,
} from './queries';
import { OUTBOX_PERSISTENCE_ADAPTERS, OUTBOX_PERSISTENCE_TOKENS } from './providers';

export * from './queries';
export * from './converter';
export * from './adapters';

/**
 * Implements the workspace_outbox ports (OutboxEvent, DeadLetterEvent,
 * SagaState, IdempotencyKey) against Prisma — reliable-messaging
 * infrastructure consumed by @workspace/events (outbox relay, saga
 * orchestrator) and @workspace/queue (job idempotency guard). No business
 * meaning beyond reliable delivery; single-tenant.
 *
 * @Global() (unlike the 12 bounded-context persistence packages, which are
 * deliberately NOT global — each gets wired into its own future
 * `modules/{context}`): @workspace/events' EventsPublisherModule needs
 * OUTBOX_EVENT_REPOSITORY_TOKEN in its own resolution scope, and it
 * correctly doesn't import this package directly (that would hard-couple a
 * generic events package to one concrete adapter implementation). This is
 * infra tier, same as PrismaModule/RedisModule/MongoModule/QueueModule.forRoot().
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    OutboxEventQuery,
    DeadLetterEventQuery,
    SagaStateQuery,
    IdempotencyKeyQuery,
    ...OUTBOX_PERSISTENCE_ADAPTERS,
  ],
  exports: [...OUTBOX_PERSISTENCE_TOKENS],
})
export class OutboxPersistenceModule {}
