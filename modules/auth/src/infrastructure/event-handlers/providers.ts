import type { Provider } from '@nestjs/common';
import type { WorkspaceEventHandlerPort } from '@workspace/ports';
import { RevokeSessionsOnErasureHandler } from './revoke-sessions-on-erasure.handler';

/**
 * Module-local DI token — not a shared port. Each handler is listed once
 * here; the generated `createDomainEventConsumer` consumer injects the
 * aggregated array and never changes as handlers are added or removed.
 */
export const AUTH_EVENT_HANDLERS = Symbol('AUTH_EVENT_HANDLERS');

export const authEventHandlerProviders: Provider[] = [
  RevokeSessionsOnErasureHandler,
  {
    provide: AUTH_EVENT_HANDLERS,
    useFactory: (revokeOnErasure: RevokeSessionsOnErasureHandler): WorkspaceEventHandlerPort[] => [
      revokeOnErasure,
    ],
    inject: [RevokeSessionsOnErasureHandler],
  },
];
