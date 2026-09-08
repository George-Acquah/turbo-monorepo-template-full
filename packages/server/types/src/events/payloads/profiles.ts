import { ConsentKind } from '@workspace/constants';
import { ProfilesEvents } from '../domain-events.constants';
import type { ChangeSet } from './shared';

// profileId canonical (a profile exists before a user); userId once claimed.

export interface ProfileCreatedPayload {
  readonly profileId: string;
  readonly userId?: string;
  readonly email: string;
  readonly source?: string; // utm / campaign attribution
}

export interface ProfileUpdatedPayload extends ChangeSet {
  readonly profileId: string;
  readonly userId?: string;
}

/** Guest -> account claim completion (doc 06 §5) — profile.userId was just linked. */
export interface ProfileLinkedPayload {
  readonly profileId: string;
  readonly userId: string;
  readonly email: string;
}

export interface ConsentGrantedPayload {
  readonly profileId: string;
  readonly userId?: string;
  readonly kind: ConsentKind;
  readonly version: string; // doc version accepted, e.g. 'tos-2026-06'
}

export interface ConsentWithdrawnPayload {
  readonly profileId: string;
  readonly userId?: string;
  readonly kind: ConsentKind;
  readonly version: string;
}

export interface ErasureRequestedPayload {
  readonly profileId: string;
  readonly userId?: string;
  readonly requestedByUserId: string;
  readonly reason?: string;
}

export interface ErasureCompletedPayload {
  readonly profileId: string;
  readonly completedAt: string;
}

export interface ProfilesEventsMap {
  [ProfilesEvents.PROFILE_CREATED]: ProfileCreatedPayload;
  [ProfilesEvents.PROFILE_UPDATED]: ProfileUpdatedPayload;
  [ProfilesEvents.PROFILE_LINKED]: ProfileLinkedPayload;
  [ProfilesEvents.CONSENT_GRANTED]: ConsentGrantedPayload;
  [ProfilesEvents.CONSENT_WITHDRAWN]: ConsentWithdrawnPayload;
  [ProfilesEvents.ERASURE_REQUESTED]: ErasureRequestedPayload;
  [ProfilesEvents.ERASURE_COMPLETED]: ErasureCompletedPayload;
}
