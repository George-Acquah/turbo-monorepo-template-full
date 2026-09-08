import { Module } from '@nestjs/common';
import { ProfilesPersistenceModule } from '@workspace/profiles-persistence';
import { GetMyProfileUseCase } from './application/member-profile/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from './application/member-profile/use-cases/update-my-profile.use-case';
import { CompleteOnboardingUseCase } from './application/member-profile/use-cases/complete-onboarding.use-case';
import { RecordConsentUseCase } from './application/consent/use-cases/record-consent.use-case';
import { WithdrawConsentUseCase } from './application/consent/use-cases/withdraw-consent.use-case';
import { GetMyConsentsUseCase } from './application/consent/use-cases/get-my-consents.use-case';
import { AccountController } from './presentation/controllers/account.controller';
import { ConsentsController } from './presentation/controllers/consents.controller';
import { ProfilesApplicationPortModule } from './profiles-application-port.module';

/**
 * Composition root for the profiles bounded-context module (member business
 * profile + consent records — doc 03 §2.3). ProfilesPersistenceModule is not
 * @Global(), so every consumer needs this import — same pattern as auth's
 * AuthModule.
 *
 * EVENT_PUBLISHER_TOKEN and TRANSACTION_PORT_TOKEN come from already-global
 * modules (EventsPublisherModule, PrismaModule) wired at the app root — no
 * new dependency or module wiring needed here.
 *
 * `CreateGuestProfileUseCase` (guest-checkout find-or-create) now lives in
 * `ProfilesApplicationPortModule`, not here — it has no controller of its
 * own, and `modules/enrolments` reaches it via `ProfilesApplicationPort`
 * rather than this module directly (see that sub-module's doc comment).
 * ProfilesApplicationPortModule is @Global() — imported here so it
 * registers `PROFILES_APPLICATION_TOKEN` app-wide the moment ProfilesModule
 * does.
 */
@Module({
  imports: [ProfilesPersistenceModule, ProfilesApplicationPortModule],
  controllers: [AccountController, ConsentsController],
  providers: [
    GetMyProfileUseCase,
    UpdateMyProfileUseCase,
    CompleteOnboardingUseCase,

    RecordConsentUseCase,
    WithdrawConsentUseCase,
    GetMyConsentsUseCase,
  ],
})
export class ProfilesModule {}
