import { formatCurrency } from '@workspace/client-lib/utils';

/**
 * Formats a minor-unit amount (pesewas/cents) as currency. All money in the API
 * is stored in minor units, so divide by 100 before handing to `formatCurrency`.
 * `locale` defaults to `en-GH` for existing call sites that don't pass one yet —
 * see `shared/lib/locale.ts` for resolving a real per-request/per-user locale.
 */
export function formatMoney(amountMinor: number, currency = 'GHS', locale = 'en-GH'): string {
  return formatCurrency(amountMinor / 100, locale, currency);
}

/** Title-cases a screaming-snake enum value, e.g. `PENDING_PAYMENT` → `Pending payment`. */
export function humanizeEnum(value: string): string {
  const lower = value.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

const RELATIVE_TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

// Keyed by locale rather than a single module-level instance, so a caller
// passing a resolved per-request locale doesn't share state with en-GH
// callers — cheap since Intl.RelativeTimeFormat construction is not the hot
// path here, and this cache still avoids re-constructing one per call.
const relativeTimeFormatters = new Map<string, Intl.RelativeTimeFormat>();
function getRelativeTimeFormatter(locale: string): Intl.RelativeTimeFormat {
  let formatter = relativeTimeFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    relativeTimeFormatters.set(locale, formatter);
  }
  return formatter;
}

/** Formats an ISO timestamp as a short relative string, e.g. "5 minutes ago". */
export function formatRelativeTime(isoDate: string, locale = 'en-GH'): string {
  const formatter = getRelativeTimeFormatter(locale);
  const seconds = (Date.parse(isoDate) - Date.now()) / 1000;
  for (const [unit, unitSeconds] of RELATIVE_TIME_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return formatter.format(Math.round(seconds), 'second');
}
