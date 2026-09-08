'use server';

import { createApiClient, unwrap, ApiError } from '@workspace/client-api';
import { serverEnv } from '@/shared/config/server.env';

export type VerifyEmailResult =
  | { status: 'success'; email: string }
  | { status: 'error'; message: string };

/**
 * Verifies an email address from the raw token in the `/verify-email/[token]`
 * link. Public endpoint — deliberately uses an unauthenticated client
 * (`createApiClient({ baseUrl: serverEnv.apiUrl })`, same as
 * `claim-account.ts`'s action), not `getServerApiClient()`: the link may be
 * opened on a different browser/device with no session cookie present, and
 * verification doesn't require one.
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
  const client = createApiClient({ baseUrl: serverEnv.apiUrl });

  try {
    const { data } = unwrap(await client.POST('/api/v1/auth/verify-email', { body: { token } }));
    return { status: 'success', email: data.email };
  } catch (error) {
    const message =
      error instanceof ApiError && (error.status === 400 || error.status === 404)
        ? 'This verification link is invalid or has expired.'
        : 'Something went wrong. Please try again.';
    return { status: 'error', message };
  }
}
