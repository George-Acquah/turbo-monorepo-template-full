'use server';

import { redirect } from 'next/navigation';
import { createApiClient, unwrap, ApiError } from '@workspace/client-api';
import type { ApiErrorResponse } from '@workspace/client-types';
import { registerSchema } from '@workspace/client-lib/validation';
import { serverEnv } from '@/shared/config/server.env';
import { setAuthCookies } from '@/shared/lib/cookies';
import type { AuthFormState } from '@/features/login';

/** Creates a member account and signs in — same cookie-setting flow as login. */
export async function register(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName') || undefined,
    lastName: formData.get('lastName') || undefined,
    turnstileToken: formData.get('turnstileToken'),
  });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const client = createApiClient({ baseUrl: serverEnv.apiUrl });

  try {
    const { data } = unwrap(await client.POST('/api/v1/auth/register', { body: parsed.data }));
    await setAuthCookies({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessMaxAge: data.expiresIn,
    });
  } catch (error) {
    const errorCode =
      error instanceof ApiError ? (error.details as ApiErrorResponse | undefined)?.errorCode : undefined;
    const message =
      errorCode === 'AUTH_TURNSTILE_VERIFICATION_FAILED'
        ? 'Security check failed. Please retry the check below and submit again.'
        : error instanceof ApiError && error.status === 409
          ? 'An account with that email already exists.'
          : 'Something went wrong. Please try again.';
    return { status: 'error', message };
  }

  redirect('/');
}
