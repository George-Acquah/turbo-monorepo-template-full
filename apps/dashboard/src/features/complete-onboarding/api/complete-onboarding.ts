'use server';

import { redirect } from 'next/navigation';
import { unwrap } from '@workspace/client-api';
import { getServerApiClient } from '@/shared/api';

/**
 * Marks first-run onboarding done (idempotent server-side) and drops the
 * member on the dashboard. Called from `/welcome` on finish or "skip to
 * dashboard".
 */
export async function completeOnboarding(): Promise<void> {
  try {
    const client = await getServerApiClient();
    unwrap(await client.POST('/api/v1/account/complete-onboarding'));
  } catch {
    // Non-fatal: the worst case is the member sees /welcome once more.
  }
  redirect('/');
}
