import { EventType } from '../domain-events.constants';

export * from './shared';
export * from './auth';
export * from './identity';
export * from './profiles';
export * from './files';
export * from './notifications';

import type { AuthEventsMap } from './auth';
import type { IdentityEventsMap } from './identity';
import type { ProfilesEventsMap } from './profiles';
import type { FilesEventsMap } from './files';
import type { NotificationsEventsMap } from './notifications';

/** Every event type → its payload. Composed from the per-context maps. */
export type AllEventsMap = AuthEventsMap &
  IdentityEventsMap &
  ProfilesEventsMap &
  FilesEventsMap &
  NotificationsEventsMap;

/**
 * Compile-time gate: every `EventType` must have a payload entry in
 * `AllEventsMap`. Adding an event constant without a matching payload here (or
 * vice-versa) fails this line — keeping the catalog and payloads in lockstep,
 * and making the payload typing non-vacuous.
 */
type _AssertCompleteMap = EventType extends keyof AllEventsMap ? true : never;
const _assertCompleteMap: _AssertCompleteMap = true;
void _assertCompleteMap;

/** Any event lacking a payload (should always be `never`). */
export type _MissingEvents = Exclude<EventType, keyof AllEventsMap>;
