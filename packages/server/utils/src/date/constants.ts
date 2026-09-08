/**
 * Time constants expressed in milliseconds.
 *
 * Useful for cache TTLs, delays, retry intervals, and scheduling.
 */

export const SECOND = 1_000;

export const MINUTE = 60 * SECOND;

export const HOUR = 60 * MINUTE;

export const DAY = 24 * HOUR;

export const WEEK = 7 * DAY;

/**
 * Average calendar month (365.2425 / 12 days).
 *
 * Intended for TTLs and rough durations.
 * Use date-fns addMonths() for calendar arithmetic.
 */
export const MONTH = 30.436875 * DAY;

/**
 * Average Gregorian year.
 *
 * Intended for durations only.
 * Use date-fns addYears() for calendar arithmetic.
 */
export const YEAR = 365.2425 * DAY;
