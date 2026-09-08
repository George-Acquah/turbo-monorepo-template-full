import { ProfilesEvents } from '@workspace/types';

/**
 * Events the profiles module PRODUCES — the single source of truth for "the
 * module that owns the MemberProfile/ConsentRecord aggregates owns these
 * events." Enforced by the `workspace/event-ownership` ESLint rule.
 */
type ProfilesEventType = (typeof ProfilesEvents)[keyof typeof ProfilesEvents];
export const profilesProduces: ProfilesEventType[] = [
  ProfilesEvents.PROFILE_CREATED,
  ProfilesEvents.PROFILE_UPDATED,
  ProfilesEvents.PROFILE_LINKED,
  ProfilesEvents.CONSENT_GRANTED,
  ProfilesEvents.CONSENT_WITHDRAWN,
];
