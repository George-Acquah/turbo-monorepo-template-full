type Primitive = string | number | boolean | null | undefined;
type QueryValue = Primitive | Primitive[];

export function withQuery(path: string, query?: Record<string, QueryValue>) {
  if (!query) return path;

  const sp = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const v of value) {
        if (v === undefined || v === null) continue;
        sp.append(key, String(v));
      }
    } else {
      sp.set(key, String(value));
    }
  }

  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

export function formatCurrency(amount: number, locale = 'en-GH', currency = 'GHS'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(
  dateStr: string,
  locale = 'en-GH',
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(
    locale,
    options ?? {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  );
}

export function formatDateTime(dateStr: string, locale = 'en-GH'): string {
  const date = new Date(dateStr);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ResolveLocaleOptions {
  /** Raw `Accept-Language` header value, e.g. `"en-US,en;q=0.9,fr;q=0.8"`. */
  acceptLanguage?: string | null;
  /** Bare BCP-47 language tag from a stored preference, e.g. `"en"` — not a full
   *  region-qualified locale. Comes from `UserPreference.language`. */
  preferredLanguage?: string | null;
  fallback?: string;
}

/**
 * Resolves a concrete, region-qualified locale (e.g. `"en-US"`, not just
 * `"en"`) for `Intl`-based formatting, given a request's `Accept-Language`
 * header and/or a stored per-user language preference.
 *
 * Priority:
 * 1. An `Accept-Language` entry whose primary language subtag matches the
 *    stored preference (respects the user's declared language while still
 *    getting the more specific region their browser/OS reports).
 * 2. The highest-priority `Accept-Language` entry, if any.
 * 3. `fallback` (default `"en-GH"`).
 *
 * Deliberately simple — no full BCP-47/RFC 4647 lookup/negotiation, no
 * validation that the resolved tag is one `Intl` actually supports (callers
 * already pass user-controlled strings straight to `Intl.NumberFormat`/
 * `Intl.DateTimeFormat` elsewhere in this file with no validation either;
 * both silently fall back to a default locale on an unrecognized tag rather
 * than throwing, per MDN).
 */
export function resolveLocale(options: ResolveLocaleOptions = {}): string {
  const { acceptLanguage, preferredLanguage, fallback = 'en-GH' } = options;

  const candidates = (acceptLanguage ?? '')
    .split(',')
    .map((entry) => entry.split(';')[0]?.trim())
    .filter((tag): tag is string => Boolean(tag) && tag !== '*');

  if (preferredLanguage) {
    const primary = preferredLanguage.toLowerCase();
    const match = candidates.find((tag) => tag.toLowerCase().startsWith(primary));
    if (match) return match;
  }

  return candidates[0] ?? fallback;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function slugify(
  text: string,
  options?: {
    separator?: string;
    lowercase?: boolean;
    maxLength?: number;
  },
): string {
  const separator = options?.separator ?? '-';
  const lowercase = options?.lowercase ?? true;
  const maxLength = options?.maxLength;

  let slug = text.trim();

  if (lowercase) {
    slug = slug.toLowerCase();
  }

  slug = slug
    .replace(/[\s_]+/g, separator)
    .replace(/[^\w-]+/g, '')
    .replace(new RegExp(`\\${separator}+`, 'g'), separator)
    .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), '');

  if (maxLength && slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    slug = slug.replace(new RegExp(`\\${separator}+$`), '');
  }

  return slug;
}

export function unslugify(slug: string, separator = '-'): string {
  return slug
    .trim()
    .replace(new RegExp(`\\${separator}+`, 'g'), ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
