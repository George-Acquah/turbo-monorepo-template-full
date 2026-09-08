import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, authCookieBase } from '@/shared/lib/cookie-names';
import { serverEnv } from '@/shared/config/server.env';

/**
 * Presence-only session gate, PLUS the proactive token refresh — the two are entangled on
 * purpose, see below. Unauthenticated requests to a private route are bounced to /login; a
 * logged-in caller hitting an auth route is sent home.
 *
 * This only checks that a session cookie EXISTS — it never inspects roles or per-resource
 * access. Fine-grained gating is the backend's job (via `GET /access/me` / `/access/check`);
 * the app must never hardcode per-page access checks (see apps/members/CLAUDE.md).
 *
 * `/programmes` and `/events` are intentionally public so guests can browse the catalogue
 * before signing up.
 *
 * `/verify-email` is public but deliberately NOT in `AUTH_PATHS`: an already-authenticated
 * (but still unverified) member must be able to open their own verification link — sent to
 * their inbox, possibly opened in a different browser/device with no session cookie — without
 * the `hasSession && isAuthPath` branch below bouncing them back to `/` first.
 */
const AUTH_PATHS = ['/login', '/register', '/claim'];
const PUBLIC_PREFIXES = [...AUTH_PATHS, '/programmes', '/events', '/verify-email'];

/**
 * Why the refresh lives here and not in `shared/api/server.ts`'s reactive 401 handler (which
 * still exists, as a safety net): cookie *writes* are only legal from a Server Action or Route
 * Handler — never from a plain Server Component render. A page's own data fetch hitting a 401
 * mid-render can still call the refresh endpoint and get a new token pair back, but it has no
 * legal way to persist it, so the attempt is silently lost — and because the refresh token is
 * single-use/rotating, that lost attempt also burns it, wrecking the *next* attempt too.
 * Middleware is the one place before rendering starts that can both read the incoming request's
 * cookies and attach Set-Cookie to what reaches the browser, so this is where refresh needs to
 * actually happen for it to work at all, not just where it's most convenient.
 */
const REFRESH_MARGIN_SECONDS = 60; // access tokens are short-lived (15m default) — refresh well before expiry, not at it
const isProd = serverEnv.environment === 'production';
const cookieBase = authCookieBase(serverEnv.cookieDomain, isProd);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  let rotated: { accessToken: string; refreshToken: string; expiresIn: number } | null = null;
  let refreshFailed = false;

  if (refreshToken && (!accessToken || isExpiringSoon(accessToken))) {
    rotated = await tryRefresh(refreshToken);
    refreshFailed = rotated === null;
  }

  // A session exists if we already had a still-valid access token, or the refresh above (if it
  // ran) produced a new one. `accessToken && !refreshFailed` covers "had a token, didn't need
  // to refresh, or refresh wasn't attempted" — `isExpiringSoon` only returns true for tokens
  // worth refreshing, not necessarily already-dead ones.
  const hasSession = Boolean(rotated) || (Boolean(accessToken) && !refreshFailed);

  if (hasSession && isAuthPath) {
    return withRotatedCookies(NextResponse.redirect(new URL('/', request.url)), rotated);
  }

  if (!hasSession && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    const response = NextResponse.redirect(loginUrl);
    if (refreshFailed) {
      // The refresh token itself is dead (revoked/expired) — the stale cookies are unusable,
      // clear them so the browser stops sending them. Same {path, domain} as everywhere else
      // that writes these cookies (cookies.ts's setAuthCookies/clearAuthCookies) — a mismatch
      // here is exactly the bug that broke logout before.
      response.cookies.delete({ name: ACCESS_TOKEN_COOKIE, ...cookieBase });
      response.cookies.delete({ name: REFRESH_TOKEN_COOKIE, ...cookieBase });
    }
    return response;
  }

  if (rotated) {
    // Visible to the RSC render this same request triggers, not just the next one — mutating
    // request.cookies updates the underlying Cookie header, and passing that header set through
    // NextResponse.next({ request: { headers } }) is what forwards it downstream. Without this,
    // the freshly-rotated token only reaches the browser on this response; the render that's
    // about to happen would still read the old (now-dead, single-use) refresh token had it
    // needed to refresh again.
    request.cookies.set(ACCESS_TOKEN_COOKIE, rotated.accessToken);
    request.cookies.set(REFRESH_TOKEN_COOKIE, rotated.refreshToken);
  }

  return withRotatedCookies(NextResponse.next({ request: { headers: request.headers } }), rotated);
}

function withRotatedCookies(
  response: NextResponse,
  rotated: { accessToken: string; refreshToken: string; expiresIn: number } | null,
): NextResponse {
  if (rotated) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, rotated.accessToken, {
      ...cookieBase,
      maxAge: rotated.expiresIn,
    });
    response.cookies.set(REFRESH_TOKEN_COOKIE, rotated.refreshToken, {
      ...cookieBase,
      maxAge: 60 * 60 * 24 * 30, // 30 days — matches setAuthCookies in shared/lib/cookies.ts
    });
  }
  return response;
}

/**
 * Reads a JWT's `exp` claim without verifying the signature — this is a proactive "should we
 * bother refreshing" heuristic, not a security check. The backend still authoritatively
 * validates the token on every request regardless of what this decides. `atob` (not Node's
 * `Buffer`) because middleware runs on the Edge runtime.
 */
function isExpiringSoon(accessToken: string): boolean {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return true;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    if (typeof json.exp !== 'number') return true;
    return json.exp * 1000 <= Date.now() + REFRESH_MARGIN_SECONDS * 1000;
  } catch {
    return true; // Can't decode it — safer to attempt a refresh than assume it's still valid.
  }
}

async function tryRefresh(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | null> {
  try {
    const res = await fetch(`${serverEnv.apiUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        ...(serverEnv.originAuthSecret ? { 'X-Origin-Auth': serverEnv.originAuthSecret } : {}),
      },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      data: { accessToken: string; refreshToken: string; expiresIn: number };
    };
    return body.data;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
