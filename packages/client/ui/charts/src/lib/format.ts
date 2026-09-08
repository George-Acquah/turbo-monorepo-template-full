/** Compact number, e.g. 48200 → "48.2k", 1_240_000 → "1.24M". */
export function compactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(value);
}

/** Minor-unit money (pesewas) → compact major-unit string, e.g. 4_820_000 → "₵48.2k". */
export function compactMoneyMinor(minor: number, symbol = '₵'): string {
  return `${symbol}${compactNumber(minor / 100)}`;
}

/** ISO date (or yyyy-mm-dd) → short axis label "12 Aug". */
export function shortDate(value: string | number | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
