import { QueueNames } from '@workspace/constants';
import { ProfilesEvents, type EventSubscription } from '@workspace/types';

/**
 * Events the auth module REACTS to.
 *
 * Exact patterns reference the real event constant from the shared catalog
 * (`@workspace/types` — every `{Context}Events` object lives centrally
 * there, so this isn't a foreign-module import, it's the shared vocabulary).
 * If `ERASURE_REQUESTED` is ever renamed, this fails to compile instead of
 * silently going stale. The DispatchEngine routes every matching event onto
 * `QueueNames.AUTH_EVENTS`, where the generated `createDomainEventConsumer`
 * consumer consumes it.
 *
 * apps/worker aggregates this into the EventSubscriptionRegistry (the same way
 * apps/api aggregates each module's route map).
 */
export const authSubscriptions: EventSubscription = {
  name: 'auth.reactions',
  eventPatterns: [ProfilesEvents.ERASURE_REQUESTED],
  queues: [QueueNames.AUTH_EVENTS],
  priority: 'standard',
};
