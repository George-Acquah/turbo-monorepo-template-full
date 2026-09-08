import type { TradingExperience } from '@workspace/constants';

export interface CreateGuestProfileInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  country?: string | null;
  experience?: TradingExperience | null;
  goal?: string | null;
  source?: string | null;
  marketingOptIn?: boolean;
}

export interface EnsureMemberProfileForUserInput {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface UpdateMyProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  country?: string | null;
  experience?: TradingExperience | null;
  goal?: string | null;
  marketingOptIn?: boolean;
}
