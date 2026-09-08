import type { Numeric } from './types';
import { toDecimal } from './precision';

export function formatNumber(value: Numeric, decimals = 2): string {
  return toDecimal(value).toFixed(decimals);
}

/**
 * 10000 -> "10K"
 * 2500000 -> "2.5M"
 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1) + 'B';
  }

  if (abs >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M';
  }

  if (abs >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K';
  }

  return value.toString();
}

export function formatCurrency(value: Numeric, currency = 'USD'): string {
  const num = toDecimal(value).toNumber();

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(num);
}
