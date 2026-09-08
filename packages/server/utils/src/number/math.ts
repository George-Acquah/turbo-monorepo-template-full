import type { Numeric } from './types';
import { toDecimal } from './precision';

export function add(a: Numeric, b: Numeric): string {
  return toDecimal(a).plus(toDecimal(b)).toString();
}

export function subtract(a: Numeric, b: Numeric): string {
  return toDecimal(a).minus(toDecimal(b)).toString();
}

export function multiply(a: Numeric, b: Numeric): string {
  return toDecimal(a).times(toDecimal(b)).toString();
}

export function divide(a: Numeric, b: Numeric): string {
  if (toDecimal(b).isZero()) {
    throw new Error('Division by zero');
  }

  return toDecimal(a).dividedBy(toDecimal(b)).toString();
}
