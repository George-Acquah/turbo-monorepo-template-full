'use server';

import { redirect } from 'next/navigation';
import { createApiClient, unwrap, ApiError } from '@workspace/client-api';
import { claimAccountSchema } from '@workspace/client-lib/validation';
import { setAuthCookies } from '@/shared/lib/cookies';
import type { AuthFormState } from '@/features/login';
import { serverEnv } from '@/shared/config/server.env';

/**
 * Sets up an account from a guest-checkout claim token and signs in. The token
 * comes from the "set up your account" email link and is carried as a hidden
 * field. Idempotent server-side (safe to retry).
 */
export async function claimAccount(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = claimAccountSchema.safeParse({
    claimToken: formData.get('claimToken'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const client = createApiClient({ baseUrl: serverEnv.apiUrl });
  
  try {
    const { data } = unwrap(await client.POST('/api/v1/auth/claim', { body: parsed.data }));
    await setAuthCookies({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessMaxAge: data.expiresIn,
    });
  } catch (error) {
    const message =
      error instanceof ApiError && (error.status === 400 || error.status === 404)
        ? 'This setup link is invalid or has expired.'
        : 'Something went wrong. Please try again.';
    return { status: 'error', message };
  }

  redirect('/');
}
