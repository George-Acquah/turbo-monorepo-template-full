import 'server-only';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, authCookieBase } from './cookie-names';
import { serverEnv } from '../config/server.env';

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './cookie-names';

const isProd = serverEnv.environment === 'production';

// Unset in dev/preview (host-only cookie); `.example.com` in real production so this also
// reaches api.example.com. Also reaches apps/landing's origin since it shares the same
// registrable domain — harmless today (landing never reads this cookie), but worth knowing if
// landing ever grows a browser-side API call.
const base = authCookieBase(serverEnv.cookieDomain, isProd);

/**
 * Writes the auth token pair as httpOnly cookies. The API returns tokens in the
 * body (it never sets cookies itself), so the Next app owns this — the backend
 * jwt strategy reads `app_access_token` from the cookie on the way back in.
 *
 * `accessMaxAge` comes from `TokenPairResponse.expiresIn` (seconds). The refresh
 * cookie is given a long, fixed life; rotation replaces it well before then.
 *
 * Only legal to call from a Server Action or Route Handler — never from a plain Server
 * Component render (Next disallows cookie writes there). `proxy.ts`'s proactive refresh is
 * what keeps the access token from expiring mid-RSC-render in the first place.
 */
export async function setAuthCookies(tokens: {
  accessToken: string;
  refreshToken: string;
  accessMaxAge: number;
}): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, { ...base, maxAge: tokens.accessMaxAge });
  store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...base,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  // Must carry the same `path`/`domain` setAuthCookies wrote with — a cookie's identity for
  // deletion is (name, domain, path) per RFC 6265, so deleting by bare name here produced a
  // *different* cookie than the one set with an explicit `domain` in real environments, and the
  // original never actually cleared (invisible in local dev, where domain is unset on both sides).
  store.delete({ name: ACCESS_TOKEN_COOKIE, ...base });
  store.delete({ name: REFRESH_TOKEN_COOKIE, ...base });
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
}
