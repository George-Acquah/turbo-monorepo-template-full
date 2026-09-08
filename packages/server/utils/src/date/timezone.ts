import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * Converts a UTC date to a target timezone representation.
 *
 * Useful for displaying trading sessions in local student time.
 */
export function toTimezone(date: Date, timeZone: string): Date {
  return toZonedTime(date, timeZone);
}

/**
 * Converts a local timezone date back to UTC.
 */
export function fromTimezone(date: Date, timeZone: string): Date {
  return fromZonedTime(date, timeZone);
}
