import { format, formatISO, formatDistanceToNowStrict, isValid } from 'date-fns';

/**
 * Formats a date using a custom pattern.
 *
 * @example
 * formatDate(new Date(), "yyyy-MM-dd")
 */
export function formatDate(date: Date, pattern = 'yyyy-MM-dd'): string {
  if (!isValid(date)) {
    throw new Error('Invalid date provided to formatDate');
  }

  return format(date, pattern);
}

/**
 * Returns ISO 8601 string.
 */
export function formatIso(date: Date): string {
  if (!isValid(date)) {
    throw new Error('Invalid date provided to formatIso');
  }

  return formatISO(date);
}

/**
 * Human-readable relative time.
 *
 * @example
 * timeAgo(new Date(Date.now() - 60000)) // "1 minute ago"
 */
export function timeAgo(date: Date): string {
  if (!isValid(date)) {
    throw new Error('Invalid date provided to timeAgo');
  }

  return formatDistanceToNowStrict(date, {
    addSuffix: true,
  });
}
