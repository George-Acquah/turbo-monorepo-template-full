import { THEME_COOKIE } from './cookie-names';

/**
 * `'system'` is a real stored value, not a synonym for "unset" — a member who explicitly picks
 * System should keep following the OS when it changes, which is different from a member who has
 * simply never chosen. Both resolve to the same *appearance* initially; only the stored value
 * distinguishes them.
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/** The backend's `ThemePreference` enum is uppercase; the frontend's is lowercase to read more
 *  naturally as a TS union. These two functions are the only place that boundary is crossed. */
export function toBackendTheme(preference: ThemePreference): 'LIGHT' | 'DARK' | 'SYSTEM' {
  return preference.toUpperCase() as 'LIGHT' | 'DARK' | 'SYSTEM';
}

export function fromBackendTheme(value: string): ThemePreference {
  return parseThemePreference(value.toLowerCase());
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') return prefersDark() ? 'dark' : 'light';
  return preference;
}

/**
 * Flips the `dark` class immediately (no reload) and writes the same cookie
 * `app/layout.tsx`'s pre-hydration script reads on the next load.
 *
 * This is the anti-flash CACHE, not the source of truth — the backend (`/v1/preferences`) is.
 * Callers pair this with a server action that persists the change; `applyTheme` alone only
 * makes the change feel instant on this device before that round-trip resolves.
 */
export function applyTheme(preference: ThemePreference): void {
  document.documentElement.classList.toggle('dark', resolveTheme(preference) === 'dark');
  document.cookie = `${THEME_COOKIE}=${preference}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

/** Narrows an untrusted cookie value. Anything unrecognised falls back to `'system'`. */
export function parseThemePreference(value: string | undefined): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}
