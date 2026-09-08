import Decimal from 'decimal.js';
import type { Numeric } from './types';

export function toDecimal(value: Numeric): Decimal {
  return new Decimal(value);
}
