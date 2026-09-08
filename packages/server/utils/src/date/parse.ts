import { parseISO, isValid } from 'date-fns';

/**
 * Parses an ISO string into a Date.
 *
 * @example
 * parseDate("2025-01-01T00:00:00Z")
 */
export function parseDate(value: string): Date {
  const date = parseISO(value);

  if (!isValid(date)) {
    throw new Error(`Invalid ISO date string: ${value}`);
  }

  return date;
}

/**
 * Safely parses a date. Returns null instead of throwing.
 */
export function safeParseDate(value: string): Date | null {
  const date = parseISO(value);

  return isValid(date) ? date : null;
}
