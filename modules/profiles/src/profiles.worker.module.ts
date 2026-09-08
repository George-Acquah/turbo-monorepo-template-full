import { Module } from '@nestjs/common';
import { ProfilesPersistenceModule } from '@workspace/profiles-persistence';
import { QueueModule, createDomainEventConsumer } from '@workspace/queue';
import { QueueNames } from '@workspace/constants';
import { EnsureMemberProfileForUserUseCase } from './application/member-profile/use-cases/ensure-member-profile-for-user.use-case';
import { profilesEventHandlerProviders, PROFILES_EVENT_HANDLERS } from './infrastructure/event-handlers/providers';

/**
 * Worker composition root — the REACTING half of the profiles context.
 * Imported by apps/worker (never apps/api). The producing half
 * (controllers/use-cases) lives in `ProfilesModule`, imported by apps/api.
 *
 * `EnsureMemberProfileForUserUseCase` is registered here directly (not
 * reached via `ProfilesApplicationPortModule`) because that sub-module only
 * exports `PROFILES_APPLICATION_TOKEN`, not the concrete use-case class —
 * `CreateProfileOnUserRegisteredHandler` below calls it directly, same as
 * `LinkProfileOnAccountClaimedHandler` calls its repository directly, since
 * both are intra-module (not the cross-module case the port exists for).
 */
@Module({
  imports: [
    ProfilesPersistenceModule,
    QueueModule.registerQueues([{ name: QueueNames.PROFILES_EVENTS }]),
  ],
  providers: [
    EnsureMemberProfileForUserUseCase,
    ...profilesEventHandlerProviders,
    createDomainEventConsumer(QueueNames.PROFILES_EVENTS, PROFILES_EVENT_HANDLERS),
  ],
})
export class ProfilesWorkerModule {}
