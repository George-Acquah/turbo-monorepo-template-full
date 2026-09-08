import { QueueNames } from '@workspace/constants';
import { AuthEvents, IdentityEvents, ProfilesEvents, type EventSubscription } from '@workspace/types';

/**
 * Events the notifications module REACTS to.
 *
 * Exact patterns reference the real event constant from the shared catalog
 * (every `{Context}Events` object lives centrally in `@workspace/types`) —
 * rename-safe: if a referenced event is ever renamed, this fails to compile
 * instead of silently going stale.
 *
 * TEMPLATE NOTE: add a pattern here for every event a new handler in
 * `infrastructure/event-handlers/` reacts to.
 */
export const notificationsSubscriptions: EventSubscription = {
  name: 'notifications.reactions',
  eventPatterns: [
    AuthEvents.USER_REGISTERED,
    IdentityEvents.ROLE_ASSIGNED_V2,
    IdentityEvents.ROLE_REVOKED_V2,
    ProfilesEvents.PROFILE_LINKED,
  ],
  queues: [QueueNames.NOTIFICATIONS_EVENTS],
  priority: 'standard',
};
