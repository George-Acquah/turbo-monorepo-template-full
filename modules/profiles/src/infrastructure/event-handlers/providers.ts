import type { Provider } from '@nestjs/common';
import type { WorkspaceEventHandlerPort } from '@workspace/ports';
import { LinkProfileOnAccountClaimedHandler } from './link-profile-on-account-claimed.handler';
import { CreateProfileOnUserRegisteredHandler } from './create-profile-on-user-registered.handler';

/**
 * Module-local DI token — not a shared port. Each handler is listed once
 * here; the generated `createDomainEventConsumer` consumer injects the
 * aggregated array and never changes as handlers are added or removed.
 */
export const PROFILES_EVENT_HANDLERS = Symbol('PROFILES_EVENT_HANDLERS');

export const profilesEventHandlerProviders: Provider[] = [
  LinkProfileOnAccountClaimedHandler,
  CreateProfileOnUserRegisteredHandler,
  {
    provide: PROFILES_EVENT_HANDLERS,
    useFactory: (
      linkOnClaim: LinkProfileOnAccountClaimedHandler,
      createOnRegistered: CreateProfileOnUserRegisteredHandler,
    ): WorkspaceEventHandlerPort[] => [linkOnClaim, createOnRegistered],
    inject: [LinkProfileOnAccountClaimedHandler, CreateProfileOnUserRegisteredHandler],
  },
];
