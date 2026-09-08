import 'server-only';
import { cache } from 'react';
import { unwrap } from '@workspace/client-api';
import { getServerApiClient } from './server';
import { getAccessToken } from '@/shared/lib/cookies';
import { fromBackendTheme, type ThemePreference } from '@/shared/lib/theme';

export interface MyPreferences {
  theme: ThemePreference;
  language: string;
  timezone: string;
  /** Display/browsing preference only — never the currency a payment is charged in.
   *  See modules/auth's user-preference.dto.ts for the full boundary explanation. */
  currency: string;
}

const DEFAULTS: MyPreferences = {
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  currency: 'GHS',
};

/**
 * `GET /v1/preferences` — the account-level source of truth for theme/language/timezone. The
 * `app_theme` cookie is a same-device anti-flash cache of this, not the other way round;
 * see shared/lib/theme.ts. `cache()`d like `getAccount`/`getCurrentUser`. Falls back to the
 * same defaults the backend documents rather than throwing, for the same reason those two do —
 * a stale/expired session should degrade the settings screen, not crash it.
 */
export const getMyPreferences = cache(async (): Promise<MyPreferences> => {
  if (!(await getAccessToken())) return DEFAULTS;
  try {
    const client = await getServerApiClient();
    const { data } = unwrap(await client.GET('/api/v1/preferences'));
    // `currency` is real on the backend response (PreferencesResponse DTO) but
    // @workspace/client-types' generated OpenAPI schema predates that field —
    // regenerate via `pnpm --filter @workspace/client-types generate-openapi`
    // against a running apps/api once available, then drop this cast.
    const currency = (data as typeof data & { currency?: string }).currency ?? DEFAULTS.currency;
    return {
      theme: fromBackendTheme(data.theme),
      language: data.language,
      timezone: data.timezone,
      currency,
    };
  } catch {
    return DEFAULTS;
  }
});
