/**
 * UI theme, stored on `workspace_auth.UserPreference`.
 *
 * `SYSTEM` is a stored choice, not "unset": a member who picks it keeps following their device as
 * that setting changes, which is meaningfully different from one who has never chosen. Both look
 * identical at first; only the stored value tells them apart — which is exactly why the older
 * `darkMode` boolean on the same model can't express this, and why `theme` supersedes it.
 */
export const ThemePreference = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  SYSTEM: 'SYSTEM',
} as const;

export type ThemePreference = (typeof ThemePreference)[keyof typeof ThemePreference];
