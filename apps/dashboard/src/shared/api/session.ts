import 'server-only';
import { cache } from 'react';
import { unwrap, ApiError } from '@workspace/client-api';
import type { components } from '@workspace/client-types';
import { getServerApiClient } from './server';
import { getAccessToken } from '@/shared/lib/cookies';

export type CurrentUser = components['schemas']['UserResponse'];
export type Account = components['schemas']['AccountResponse'];

/**
 * The signed-in user (`GET /auth/me`), or null if unauthenticated. `cache()`
 * dedupes it across a single render — the shell and any screen can call it
 * freely without extra round-trips. Returns null on any error rather than
 * throwing, so a stale/expired session degrades to "logged out" instead of a
 * crashed layout.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!(await getAccessToken())) return null;
  try {
    const client = await getServerApiClient();
    const { data } = unwrap(await client.GET('/api/v1/auth/me'));
    return data;
  } catch {
    return null;
  }
});

/**
 * The member's profile (`GET /account`) — the only source of `profileId` and
 * the editable name/phone/country/experience fields. Also `cache()`d.
 */
export const getAccount = cache(async (): Promise<Account | null> => {
  if (!(await getAccessToken())) return null;
  try {
    const client = await getServerApiClient();
    const { data } = unwrap(await client.GET('/api/v1/account'));
    return data;
  } catch {
    return null;
  }
});

/**
 * Like `getAccount()`, but for callers that need to distinguish "genuinely
 * unauthenticated" from any other failure (a transient 500, a timeout, a 404
 * because the profile isn't linked yet) instead of collapsing both into
 * `null`. Only a real 401 (or no access-token cookie) should ever trigger a
 * `/login` redirect — anything else should render a visible error state, not
 * silently redirect: `proxy.ts`'s `hasSession && isAuthPath` check bounces an
 * already-authenticated user straight back from `/login` to `/`, so a false
 * "not authenticated" redirect here degrades into a silent bounce to the
 * dashboard instead of a visible error.
 */
export const getAccountOrThrow = cache(async (): Promise<Account> => {
  if (!(await getAccessToken())) {
    throw new ApiError('Not authenticated', 401, '/api/v1/account');
  }
  const client = await getServerApiClient();
  const { data } = unwrap(await client.GET('/api/v1/account'));
  return data;
});

/** Convenience for the topbar/menus: display name + initials. */
export function displayName(user: Pick<CurrentUser, 'firstName' | 'lastName' | 'email'>): {
  name: string;
  initials: string;
} {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const name = full || user.email || 'Member';
  const fromNames = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`;
  const initials = (fromNames || user.email?.[0] || 'M').toUpperCase();
  return { name, initials };
}
