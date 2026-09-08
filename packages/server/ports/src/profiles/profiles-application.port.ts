import { ConsentKind, TradingExperience } from '@workspace/constants';
import { DatabaseTx } from '../database/schema/shared';

export interface ProfileSummary {
  id: string;
  email: string;
  userId: string | null;
}

export interface FindOrCreateProfileByEmailInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  experience?: TradingExperience;
  goal?: string;
  source?: string;
}

export interface EnsureProfileForUserInput {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ActiveProfileBatchItem {
  profileId: string;
  userId: string | null;
}

export interface ListActiveProfileBatchInput {
  afterId?: string;
  limit: number;
  /** Skip this user's own profile — e.g. a broadcast excluding its creator. */
  excludeUserId?: string;
}

export interface ListActiveProfileBatchResult {
  items: ActiveProfileBatchItem[];
  /** Pass back as `afterId` to fetch the next page; absent once exhausted. */
  nextAfterId?: string;
}

export interface RecordConsentInput {
  profileId: string;
  kind: ConsentKind;
  version: string;
  granted: boolean;
  ipAddress?: string;
}

export interface ProfileContact {
  email: string;
  phone?: string;
  /** Null when the profile hasn't been claimed by a User yet (guest
   * checkout) — SMS/push/preference-gated channels need this (see
   * `NotificationDispatchService.canReachUser`), email doesn't. */
  userId?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * The sanctioned seam for another context to read/write profile data
 * without importing `ports/database/schema/profiles/**` directly. Implemented
 * by `modules/profiles` (`ProfilesApplicationService`), consumed by
 * `modules/enrolments`' create-enrolment flow (guest-checkout profile
 * find-or-create + terms-of-service consent write). Mirrors
 * `PaymentsApplicationPort`'s shape.
 */
export abstract class ProfilesApplicationPort {
  abstract findOrCreateProfileByEmail(
    input: FindOrCreateProfileByEmailInput,
    tx?: DatabaseTx,
  ): Promise<ProfileSummary>;

  /**
   * Find-or-create for an *authenticated* caller who already has a `userId`
   * (unlike `findOrCreateProfileByEmail`, the guest-checkout entry point,
   * which always creates with `userId: null`). Used to close the gap where
   * direct self-registration never creates a `MemberProfile` — see
   * `modules/events`' `RegisterForEventUseCase` and `modules/profiles`' own
   * `CreateProfileOnUserRegisteredHandler`.
   */
  abstract ensureProfileForUser(
    input: EnsureProfileForUserInput,
    tx?: DatabaseTx,
  ): Promise<ProfileSummary>;

  /**
   * Keyset-paginated sweep over every active member profile — backs
   * `modules/notifications`' catalog-creation broadcast fan-out (cohort/
   * masterclass created → notify every other member). Never a single
   * unbounded read.
   */
  abstract listActiveProfileBatch(
    input: ListActiveProfileBatchInput,
  ): Promise<ListActiveProfileBatchResult>;

  abstract recordConsent(input: RecordConsentInput, tx?: DatabaseTx): Promise<void>;

  /**
   * Resolves a profile's contact info — the one legitimate cross-context
   * need for a dunning/notification email that needs a real address, not
   * just an in-app fact. Returns `null` on a miss rather than throwing, same
   * "reads never throw" convention as `CatalogApplicationPort`.
   */
  abstract getProfileContact(profileId: string): Promise<ProfileContact | null>;
}
