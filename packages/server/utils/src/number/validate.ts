import { toDecimal } from './precision';
import type { Numeric } from './types';

export function isNumeric(value: unknown): boolean {
  try {
    toDecimal(value as Numeric);
    return true;
  } catch {
    return false;
  }
}

export function isPositive(value: Numeric): boolean {
  return toDecimal(value).isPositive();
}

export function isZero(value: Numeric): boolean {
  return toDecimal(value).isZero();
}
