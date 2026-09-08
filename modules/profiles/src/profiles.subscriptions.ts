import { QueueNames } from '@workspace/constants';
import { AuthEvents, type EventSubscription } from '@workspace/types';

/**
 * Events the profiles module REACTS to. `AuthEvents.ACCOUNT_CLAIMED` is the
 * guest → account claim effect (doc 06 §5) — see
 * infrastructure/event-handlers/link-profile-on-account-claimed.handler.ts.
 * `AuthEvents.USER_REGISTERED` ensures a direct self-registrant gets a
 * `MemberProfile` too — see
 * infrastructure/event-handlers/create-profile-on-user-registered.handler.ts.
 */
export const profilesSubscriptions: EventSubscription = {
  name: 'profiles.reactions',
  eventPatterns: [AuthEvents.ACCOUNT_CLAIMED, AuthEvents.USER_REGISTERED],
  queues: [QueueNames.PROFILES_EVENTS],
  priority: 'standard',
};
