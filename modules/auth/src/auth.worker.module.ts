import { Module } from '@nestjs/common';
import { AuthPersistenceModule } from '@workspace/auth-persistence';
import { QueueModule, createDomainEventConsumer, createQueueConsumer } from '@workspace/queue';
import { QueueNames } from '@workspace/constants';
import { authEventHandlerProviders, AUTH_EVENT_HANDLERS } from './infrastructure/event-handlers/providers';
import { SendEmailJobProcessor } from './infrastructure/processors/send-email-job.processor';
import { IssueAccountClaimTokenUseCase } from './application/use-cases/issue-account-claim-token.use-case';

/**
 * Worker composition root — the REACTING half of the auth context.
 *
 * Imported by apps/worker (never apps/api). Registers the `auth.events` queue
 * and provides the processor + handlers that consume it. The producing half
 * (controllers/use-cases) lives in `AuthModule`, imported by apps/api. One
 * package, two roots.
 *
 * `AuthPersistenceModule` gives handlers the repository tokens they need
 * (USER_SESSION_REPOSITORY_TOKEN). HASH_PORT_TOKEN/LOGGER_TOKEN — needed by
 * the QueueProcessor base — come from apps/worker's global infra modules.
 *
 * `QueueNames.EMAIL_QUEUE` hosts the plain (non-domain-event) verification
 * email job `RequestEmailVerificationUseCase` enqueues directly via
 * `QUEUE_BUS_TOKEN` — mirrors `MembershipsWorkerModule`'s `SCHEDULED_JOBS`
 * precedent: `createQueueConsumer` + a `QueueJobProcessor`, no outbox, no
 * domain event, no audit trail (deliberately — see that use-case's doc
 * comment on why a raw token must never enter the outbox). `EMAIL_DELIVERY_PORT`
 * comes from apps/worker's already-global `EmailModule` — no import needed here.
 */
@Module({
  imports: [
    AuthPersistenceModule,
    QueueModule.registerQueues([
      { name: QueueNames.AUTH_EVENTS },
      { name: QueueNames.EMAIL_QUEUE },
    ]),
  ],
  providers: [
    // SendAccountClaimOnEnrolmentActivatedHandler (in authEventHandlerProviders)
    // depends on this to issue the claim token + enqueue the "set up your
    // account" email onto EMAIL_QUEUE.
    IssueAccountClaimTokenUseCase,
    ...authEventHandlerProviders,
    createDomainEventConsumer(QueueNames.AUTH_EVENTS, AUTH_EVENT_HANDLERS),

    SendEmailJobProcessor,
    createQueueConsumer(QueueNames.EMAIL_QUEUE, SendEmailJobProcessor),
  ],
})
export class AuthWorkerModule {}
