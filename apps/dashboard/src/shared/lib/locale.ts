import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { resolveLocale } from '@workspace/client-lib/utils';
import { getMyPreferences } from '@/shared/api/preferences';

/**
 * Resolves a concrete, region-qualified locale for the current request —
 * combining the browser's `Accept-Language` header with the signed-in
 * member's stored `language` preference (`GET /v1/preferences`, falling back
 * to `en` for guests). See `@workspace/client-lib/utils`'s `resolveLocale` for
 * the priority order.
 *
 * `cache()`d like `getCurrentUser`/`getMyPreferences` — safe to call from
 * any server component in the same render without extra work.
 *
 * This is the seam formatting call sites should adopt incrementally
 * (`formatMoney(amountMinor, currency, await getRequestLocale())`) rather
 * than a mass rewrite of every existing call site in one pass — see
 * docs/global-readiness/state.md's Chunk 3 notes for what's wired end-to-end
 * today versus what's still on the `en-GH` default.
 */
export const getRequestLocale = cache(async (): Promise<string> => {
  const [headerList, preferences] = await Promise.all([headers(), getMyPreferences()]);

  return resolveLocale({
    acceptLanguage: headerList.get('accept-language'),
    preferredLanguage: preferences.language,
  });
});
