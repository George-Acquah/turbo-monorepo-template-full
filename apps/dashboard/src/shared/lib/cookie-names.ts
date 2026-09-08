/**
 * Cookie names only — no `server-only`, no `next/headers`. Safe to import from
 * the proxy (edge runtime) as well as server components. The read/write helpers
 * that actually touch `next/headers` live in `cookies.ts` (server-only).
 */
export const ACCESS_TOKEN_COOKIE = 'app_access_token';
export const REFRESH_TOKEN_COOKIE = 'app_refresh_token';
export const SIDEBAR_COOKIE = 'app_sidebar';
/**
 * Read by the pre-hydration anti-flash script in `app/layout.tsx` — keep the name in sync with
 * that inline script if this ever changes. Namespaced deliberately: an earlier bare `theme`
 * name would collide with any sibling app on the same registrable domain.
 */
export const THEME_COOKIE = 'app_theme';

/**
 * Set client-side (not httpOnly — a UI preference, not a security boundary) when a member
 * dismisses the "please verify your email" reminder banner, so it doesn't reappear on every
 * page load within the same browsing session. Read server-side (`next/headers` `cookies()`)
 * wherever the banner decides whether to render, so there's no dismiss-then-flash-back-in on
 * navigation. Not cleared on verification — a verified user's `emailVerified` flag alone already
 * hides the banner regardless of this cookie's value.
 */
export const EMAIL_VERIFICATION_BANNER_DISMISSED_COOKIE = 'app_verify_email_dismissed';

/**
 * Attributes shared by every place that writes the auth cookies — `cookies.ts`'s
 * `setAuthCookies`/`clearAuthCookies` (RSC/Server Actions) and `proxy.ts` (edge middleware,
 * for the proactive refresh below). One shared builder instead of two independent copies is
 * deliberate: a previous bug here was exactly two copies of `{domain, path}` silently
 * drifting apart (`clearAuthCookies` omitted `domain`, so it deleted a *different* cookie
 * than the one `setAuthCookies` wrote in production). Edge-safe — no `next/headers` import.
 */
export function authCookieBase(cookieDomain: string | undefined, secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };
}
