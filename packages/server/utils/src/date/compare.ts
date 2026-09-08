import { isAfter, isBefore, isFuture, isPast, isToday, isTomorrow, isValid } from 'date-fns';
import { now } from './clock';

/**
 * Returns true if a date has already passed.
 */
export function hasExpired(date: Date): boolean {
  return isBefore(date, now());
}

/**
 * Returns true if a date is currently active in a range.
 */
export function isActive(start: Date, end: Date): boolean {
  const current = now();

  return current >= start && current <= end;
}

export { isAfter, isBefore, isFuture, isPast, isToday, isTomorrow, isValid };
