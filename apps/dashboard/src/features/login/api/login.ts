'use server';

import { redirect } from 'next/navigation';
import { createApiClient, unwrap, ApiError } from '@workspace/client-api';
import type { ApiErrorResponse } from '@workspace/client-types';
import { loginSchema } from '@workspace/client-lib/validation';
import { serverEnv } from '@/shared/config/server.env';
import { setAuthCookies } from '@/shared/lib/cookies';
import type { AuthFormState } from '../model/state';

/**
 * Signs in with email + password. The API returns the token pair in the body;
 * we set the httpOnly cookies here (the backend never sets them itself), then
 * redirect into the app. Validation reuses `@workspace/client-lib`'s shared zod
 * schema so client and server agree on the rules.
 */
export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    turnstileToken: formData.get('turnstileToken'),
  });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const client = createApiClient({ baseUrl: serverEnv.apiUrl });

  try {
    const { data } = unwrap(await client.POST('/api/v1/auth/login', { body: parsed.data }));
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
        : error instanceof ApiError && error.status === 401
          ? 'Incorrect email or password.'
          : 'Something went wrong. Please try again.';
    return { status: 'error', message };
  }

  redirect('/');
}
