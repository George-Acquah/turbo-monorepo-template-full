import { Global, Module } from '@nestjs/common';
import { ProfilesPersistenceModule } from '@workspace/profiles-persistence';
import { PROFILES_APPLICATION_TOKEN } from '@workspace/ports';
import { ProfilesApplicationService } from './application/application-port/profiles-application.service';
import { CreateGuestProfileUseCase } from './application/member-profile/use-cases/create-guest-profile.use-case';
import { EnsureMemberProfileForUserUseCase } from './application/member-profile/use-cases/ensure-member-profile-for-user.use-case';
import { RecordConsentForProfileUseCase } from './application/consent/use-cases/record-consent-for-profile.use-case';

/**
 * Global sub-module exposing `ProfilesApplicationPort` (bound to
 * `PROFILES_APPLICATION_TOKEN`) to the whole app — the sanctioned way for
 * another `modules/{context}` package (e.g. `modules/enrolments`) to reach
 * profile data, since it may not import `ProfilesModule` directly. See
 * `modules/catalog`'s `CatalogApplicationPortModule` for the identical
 * pattern and rationale.
 *
 * Imports `ProfilesPersistenceModule` directly (not just relying on
 * `ProfilesModule` also importing it) — sibling imports under the same
 * parent module don't share providers in Nest, so this module needs its own
 * access to `MEMBER_PROFILE_REPOSITORY_TOKEN`/`CONSENT_RECORD_REPOSITORY_TOKEN`.
 */
@Global()
@Module({
  imports: [ProfilesPersistenceModule],
  providers: [
    CreateGuestProfileUseCase,
    EnsureMemberProfileForUserUseCase,
    RecordConsentForProfileUseCase,
    ProfilesApplicationService,
    { provide: PROFILES_APPLICATION_TOKEN, useExisting: ProfilesApplicationService },
  ],
  exports: [PROFILES_APPLICATION_TOKEN],
})
export class ProfilesApplicationPortModule {}
