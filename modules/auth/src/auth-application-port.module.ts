import { Global, Module } from '@nestjs/common';
import { AuthPersistenceModule } from '@workspace/auth-persistence';
import { AUTH_APPLICATION_TOKEN } from '@workspace/ports';
import { AuthApplicationService } from './application/services/auth-application.service';

/**
 * Global sub-module exposing `AuthApplicationPort` (bound to
 * `AUTH_APPLICATION_TOKEN`) to the whole app — the sanctioned way for another
 * `modules/{context}` package to reach User contact data without importing
 * `ports/database/schema/auth/**` directly. Mirrors
 * `ProfilesApplicationPortModule`'s exact shape/rationale.
 *
 * Imports `AuthPersistenceModule` directly (not just relying on `AuthModule`
 * also importing it) — sibling imports under the same parent module don't
 * share providers in Nest, so this module needs its own access to
 * `USER_REPOSITORY_TOKEN`.
 */
@Global()
@Module({
  imports: [AuthPersistenceModule],
  providers: [
    AuthApplicationService,
    { provide: AUTH_APPLICATION_TOKEN, useExisting: AuthApplicationService },
  ],
  exports: [AUTH_APPLICATION_TOKEN],
})
export class AuthApplicationPortModule {}
