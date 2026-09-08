'use server';

import { redirect } from 'next/navigation';
import { unwrap } from '@workspace/client-api';
import { getServerApiClient } from '@/shared/api';
import { clearAuthCookies } from '@/shared/lib/cookies';

/** Revokes the session server-side, clears cookies, and returns to /login. */
export async function logout(): Promise<void> {
  try {
    const client = await getServerApiClient();
    unwrap(await client.POST('/api/v1/auth/logout'));
  } catch {
    // Even if the revoke call fails, still clear local cookies below.
  }
  await clearAuthCookies();
  redirect('/login');
}
