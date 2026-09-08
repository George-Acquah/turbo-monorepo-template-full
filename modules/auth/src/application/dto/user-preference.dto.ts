import type { Currency, ThemePreference } from '@workspace/constants';

/**
 * The self-service slice of `UserPreference`, deliberately narrower than the persistence row:
 *
 * - `currency` IS exposed, but strictly as a **display/browsing preference** — which currency to
 *   show catalog/price-plan amounts in while shopping. It is never read by anything that
 *   determines what a payment actually charges: `Order`/`Payment`/`Invoice` all carry their own
 *   `currency` column, set from the price plan actually purchased (validated against the same
 *   `Currency` enum independently), and the backend still owns pricing/order amounts per root
 *   CLAUDE.md. Do not add a code path that reads this field to decide a charge currency — that
 *   would recreate exactly the control this boundary exists to avoid.
 * - `emailNotifications`/`smsNotifications`/`pushNotifications`/`marketingEmails` are excluded —
 *   nothing reads them. Real delivery gating is per category × channel in
 *   `workspace_notifications.NotificationPreference` (see /v1/notification-preferences); marketing
 *   opt-in is `MemberProfile.marketingOptIn` + `ConsentRecord`. Exposing these would be three
 *   competing sources of truth for one decision.
 * - `darkMode` is excluded — superseded by `theme`, which can also express "follow the device".
 * - `preferences` (JsonB) is excluded — untyped and unvalidated; nothing writes it yet.
 */
export interface MyPreferences {
  theme: ThemePreference;
  language: string;
  timezone: string;
  currency: Currency;
}

export type UpdateMyPreferencesInput = Partial<MyPreferences>;
