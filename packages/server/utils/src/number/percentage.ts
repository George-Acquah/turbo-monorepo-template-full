import type { Numeric } from './types';
import { toDecimal } from './precision';

/**
 * Calculates percentage: (part / whole) * 100
 */
export function percentage(part: Numeric, whole: Numeric): number {
  const p = toDecimal(part);
  const w = toDecimal(whole);

  if (w.isZero()) return 0;

  return p.dividedBy(w).times(100).toNumber();
}

/**
 * Percentage change between two values
 */
export function percentageChange(oldValue: Numeric, newValue: Numeric): number {
  const oldV = toDecimal(oldValue);
  const newV = toDecimal(newValue);

  if (oldV.isZero()) return 0;

  return newV.minus(oldV).dividedBy(oldV).times(100).toNumber();
}
