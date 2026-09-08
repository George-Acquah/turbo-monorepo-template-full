import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
} from 'date-fns';

import { now } from './clock';
import { DateRange } from './types';

/**
 * Today range
 */
export function today(): DateRange {
  const current = now();

  return {
    start: startOfDay(current),
    end: endOfDay(current),
  };
}

/**
 * Yesterday range
 */
export function yesterday(): DateRange {
  const current = subDays(now(), 1);

  return {
    start: startOfDay(current),
    end: endOfDay(current),
  };
}

/**
 * This week range
 */
export function thisWeek(): DateRange {
  const current = now();

  return {
    start: startOfWeek(current),
    end: endOfWeek(current),
  };
}

/**
 * This month range
 */
export function thisMonth(): DateRange {
  const current = now();

  return {
    start: startOfMonth(current),
    end: endOfMonth(current),
  };
}

/**
 * Last N days range
 */
export function lastNDays(days: number): DateRange {
  const end = now();
  const start = subDays(end, days);

  return {
    start: startOfDay(start),
    end: endOfDay(end),
  };
}

/**
 * Last 30 days (common analytics window)
 */
export function last30Days(): DateRange {
  return lastNDays(30);
}

/**
 * Last 90 days (growth analytics)
 */
export function last90Days(): DateRange {
  return lastNDays(90);
}
