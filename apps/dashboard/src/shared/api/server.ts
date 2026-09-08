import 'server-only';
import { cache } from 'react';
import { createApiClient, type ApiClient } from '@workspace/client-api';
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '@/shared/lib/cookies';
import { serverEnv } from '../config/server.env';

/**
 * Server-side API client for RSC reads and server actions. Forwards the caller's access
 * token as a Bearer header. On a 401 it rotates the token pair once via `POST /auth/refresh`
 * (refresh token as Bearer — the refresh strategy is Bearer-only), re-sets the cookies, and
 * retries. If refresh fails, cookies are cleared and the proxy bounces to /login next
 * navigation.
 *
 * `cache()`d like `getAccount`/`getCurrentUser` (shared/api/session.ts) so a page with several
 * independent Server Components (one per Suspense boundary) doesn't re-read the access-token
 * cookie N times. This does NOT by itself dedupe token *refreshes* — see `rotateTokens` below,
 * which is separately `cache()`d for that.
 */
export const getServerApiClient = cache(async (): Promise<ApiClient> => {
  const token = await getAccessToken();
  return createApiClient({
    baseUrl: serverEnv.apiUrl,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    fetchImpl: refreshingFetch,
  });
});

const REFRESH_PATH = '/api/v1/auth/refresh';

async function refreshingFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status !== 401 || String(input).includes(REFRESH_PATH)) return response;

  const rotated = await rotateTokens();
  if (!rotated) return response;

  return fetch(input, {
    ...init,
    headers: { ...(init?.headers as Record<string, string>), Authorization: `Bearer ${rotated}` },
  });
}

/**
 * `cache()`d so N concurrent 401s in one render (now routine — a page can have several
 * independent Suspense-boundary fetches) trigger exactly one refresh attempt instead of N
 * racing ones. That matters because the backend's refresh token is single-use/rotating
 * (modules/auth's RefreshTokenUseCase revokes the old session before issuing a new one) —
 * without this, the loser of a concurrent-refresh race gets a 401 for a token the winner
 * already rotated away, and its failure-path `clearAuthCookies()` would wipe the session the
 * winner just established.
 *
 * Cookie *writes* are also only legal during a Server Action/Route Handler — never during a
 * plain Server Component render, which is exactly what triggers this path now (an RSC data
 * fetch hitting 401). `trySetAuthCookies`/`tryClearAuthCookies` swallow that specific failure
 * instead of letting it crash the render: the backend has already rotated the token
 * server-side by the time we know we can't persist it, so a refresh that can't be persisted is
 * honestly a failed refresh (return null, let the original 401 surface as a normal `ApiError`)
 * — not something to crash over. An uncaught throw here previously escaped `getAccount()`'s
 * try/catch as a swallowed `null`, which sent `AccountPage` to `redirect('/login')` even though
 * the session might still be fine — and because the access-token cookie was never actually
 * cleared (the failed write changed nothing), the browser then hit `/login` still carrying a
 * cookie `proxy.ts` read as "already authenticated," bouncing back to `/`. When called from a
 * real Server Action (login/logout/mutations), cookie writes succeed normally and nothing here
 * changes.
 */
const rotateTokens = cache(async (): Promise<string | null> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${serverEnv.apiUrl}${REFRESH_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        ...(serverEnv.originAuthSecret ? { 'X-Origin-Auth': serverEnv.originAuthSecret } : {}),
      },
    });
    if (!res.ok) {
      await tryClearAuthCookies();
      return null;
    }
    const body = (await res.json()) as {
      data: { accessToken: string; refreshToken: string; expiresIn: number };
    };
    const { accessToken, refreshToken: nextRefresh, expiresIn } = body.data;
    const persisted = await trySetAuthCookies({ accessToken, refreshToken: nextRefresh, accessMaxAge: expiresIn });
    return persisted ? accessToken : null;
  } catch {
    await tryClearAuthCookies();
    return null;
  }
});

async function trySetAuthCookies(tokens: Parameters<typeof setAuthCookies>[0]): Promise<boolean> {
  try {
    await setAuthCookies(tokens);
    return true;
  } catch {
    return false;
  }
}

async function tryClearAuthCookies(): Promise<void> {
  try {
    await clearAuthCookies();
  } catch {
    // Same illegal-write-outside-an-action case as trySetAuthCookies — nothing to do here,
    // the cookies simply stay as they are until a request that can legally clear them.
  }
}
