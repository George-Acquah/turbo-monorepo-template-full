'use server';

import { revalidatePath } from 'next/cache';
import { unwrap } from '@workspace/client-api';
import { getServerApiClient } from '@/shared/api';

type Experience = 'none' | 'learning' | 'losing' | 'breakeven' | 'profitable';

export interface OnboardingProfileInput {
  experience?: Experience | '';
  goal?: string;
}

/**
 * Saves the two "quick questions" from `/welcome` onto the member profile.
 * Best-effort — a failure here shouldn't block the flow, so it returns a
 * boolean rather than throwing.
 */
export async function saveOnboardingProfile(input: OnboardingProfileInput): Promise<boolean> {
  const body: Record<string, unknown> = {};
  if (input.experience) body.experience = input.experience;
  if (typeof input.goal === 'string' && input.goal.trim()) body.goal = input.goal.trim();
  if (Object.keys(body).length === 0) return true;

  try {
    const client = await getServerApiClient();
    unwrap(await client.PATCH('/api/v1/account', { body }));
    revalidatePath('/account');
    return true;
  } catch {
    return false;
  }
}
