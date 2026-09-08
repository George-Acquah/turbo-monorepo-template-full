import type { Account } from '@/entities/account';

/**
 * Fields that make up a "complete" profile. Deliberately excludes email (always present — it's
 * the login identity, so counting it would inflate every score by a fixed amount and mean
 * nothing) and marketingOptIn (a preference, not profile data).
 */
const FIELDS = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'phone', label: 'Phone number' },
  { key: 'country', label: 'Country' },
  { key: 'experience', label: 'Trading experience' },
  { key: 'goal', label: 'Your goal' },
] as const satisfies readonly { key: keyof Account; label: string }[];

export interface Completeness {
  percent: number;
  filled: number;
  total: number;
  /** Human labels for what's still empty — drives the "finish your profile" nudge. */
  missing: string[];
}

export function profileCompleteness(account: Account): Completeness {
  const missing = FIELDS.filter(({ key }) => {
    const value = account[key];
    return value === null || value === undefined || String(value).trim() === '';
  }).map(({ label }) => label);

  const filled = FIELDS.length - missing.length;
  return {
    percent: Math.round((filled / FIELDS.length) * 100),
    filled,
    total: FIELDS.length,
    missing,
  };
}
