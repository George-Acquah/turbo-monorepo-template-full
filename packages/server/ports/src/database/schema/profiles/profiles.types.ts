import { TradingExperience, ConsentKind } from '@workspace/constants';
import { RepoQueryOptions } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// MemberProfile Types — people as the business sees them. May exist before a
// User does (guest checkout creates a profile keyed by email, linked by
// userId once the account is claimed).
// ─────────────────────────────────────────────────────────────────────────────
export interface MemberProfilePersistence {
  id: string;
  userId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  country: string | null;
  experience: TradingExperience | null;
  goal: string | null;
  source: string | null;
  marketingOptIn: boolean;
  /**
   * Free-form bag. Known keys:
   * - `onboardedAt`: ISO string, set once when the member finishes the
   *   first-run onboarding flow (apps/members `/welcome`). Absent = never.
   */
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateMemberProfileInput extends Omit<
  MemberProfilePersistence,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
> {
  id?: string;
}

export type UpdateMemberProfileInput = Partial<
  Pick<
    MemberProfilePersistence,
    | 'userId'
    | 'firstName'
    | 'lastName'
    | 'phone'
    | 'country'
    | 'experience'
    | 'goal'
    | 'source'
    | 'marketingOptIn'
    | 'metadata'
  >
>;

// ─────────────────────────────────────────────────────────────────────────────
// ConsentRecord Types — append-only, never mutated.
// ─────────────────────────────────────────────────────────────────────────────
export interface ConsentRecordPersistence {
  id: string;
  profileId: string;
  kind: ConsentKind;
  version: string;
  granted: boolean;
  ipAddress: string | null;
  createdAt: Date;
}

export type CreateConsentRecordInput = Omit<ConsentRecordPersistence, 'id' | 'createdAt'>;

// ─────────────────────────────────────────────────────────────────────────────
// Query Options
// ─────────────────────────────────────────────────────────────────────────────
export type MemberProfilePersistenceQueryOptions<
  K extends keyof MemberProfilePersistence = keyof MemberProfilePersistence,
> = RepoQueryOptions<MemberProfilePersistence, K>;

export type ConsentRecordPersistenceQueryOptions<
  K extends keyof ConsentRecordPersistence = keyof ConsentRecordPersistence,
> = RepoQueryOptions<ConsentRecordPersistence, K>;
