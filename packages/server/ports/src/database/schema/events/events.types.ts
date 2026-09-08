import { LiveEventKind, LiveEventStatus, EventAccessPolicy, EventRegistrationStatus } from '@workspace/constants';
import { RepoQueryOptions } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// LiveEvent Types
// ─────────────────────────────────────────────────────────────────────────────
export interface LiveEventPersistence {
  id: string;
  slug: string;
  title: string;
  kind: LiveEventKind;
  status: LiveEventStatus;
  accessPolicy: EventAccessPolicy;
  requiredResourceType: string | null;
  requiredResourceId: string | null;
  cohortId: string | null;
  startsAt: Date;
  endsAt: Date | null;
  timezone: string;
  capacity: number | null;
  seatsTaken: number;
  mentorName: string | null;
  mentorUserId: string | null;
  joinUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLiveEventInput extends Omit<
  LiveEventPersistence,
  'id' | 'status' | 'seatsTaken' | 'createdAt' | 'updatedAt'
> {
  id?: string;
  status?: LiveEventStatus;
}

export type UpdateLiveEventInput = Partial<
  Omit<LiveEventPersistence, 'id' | 'slug' | 'createdAt' | 'updatedAt'>
>;

// ─────────────────────────────────────────────────────────────────────────────
// EventRegistration Types
// ─────────────────────────────────────────────────────────────────────────────
export interface EventRegistrationPersistence {
  id: string;
  eventId: string;
  profileId: string;
  status: EventRegistrationStatus;
  remindAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventRegistrationInput extends Omit<
  EventRegistrationPersistence,
  'id' | 'status' | 'createdAt' | 'updatedAt'
> {
  id?: string;
  status?: EventRegistrationStatus;
}

export type UpdateEventRegistrationInput = Partial<
  Pick<EventRegistrationPersistence, 'status' | 'remindAt'>
>;

// ─────────────────────────────────────────────────────────────────────────────
// EventReplay Types
// ─────────────────────────────────────────────────────────────────────────────
export interface EventReplayPersistence {
  id: string;
  eventId: string;
  videoFileId: string;
  summary: string | null;
  keyTakeaways: string[];
  publishedAt: Date | null;
  createdAt: Date;
}

export interface CreateEventReplayInput extends Omit<
  EventReplayPersistence,
  'id' | 'publishedAt' | 'createdAt'
> {
  id?: string;
}

export type UpdateEventReplayInput = Partial<
  Pick<EventReplayPersistence, 'summary' | 'keyTakeaways' | 'publishedAt'>
>;

// ─────────────────────────────────────────────────────────────────────────────
// Query Options
// ─────────────────────────────────────────────────────────────────────────────
export type LiveEventPersistenceQueryOptions<K extends keyof LiveEventPersistence = keyof LiveEventPersistence> =
  RepoQueryOptions<LiveEventPersistence, K>;

export type EventRegistrationPersistenceQueryOptions<
  K extends keyof EventRegistrationPersistence = keyof EventRegistrationPersistence,
> = RepoQueryOptions<EventRegistrationPersistence, K>;

export type EventReplayPersistenceQueryOptions<
  K extends keyof EventReplayPersistence = keyof EventReplayPersistence,
> = RepoQueryOptions<EventReplayPersistence, K>;
