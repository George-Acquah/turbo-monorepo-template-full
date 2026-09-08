'use server';

import { unwrap } from '@workspace/client-api';
import { getServerApiClient } from '@/shared/api';

/**
 * Resends the email verification link for the signed-in member. Mutation-only
 * (204, no body) — no redirect, no cookie writes. Mirrors `logout()`'s shape
 * (`features/logout/api/logout.ts`): an authenticated `getServerApiClient()`
 * call, `unwrap`ped, with the caller (the banner) handling loading/error UI.
 */
export async function resendVerificationEmail(): Promise<void> {
  const client = await getServerApiClient();
  unwrap(await client.POST('/api/v1/auth/verify-email/resend'));
}
