/**
 * Categorical hues, assigned in FIXED order (never cycled) — the dataviz rule. Each
 * value is a CSS custom property from the theme (`packages/client/theme/tokens.css`),
 * so charts stay tokened and theme-aware; never a raw literal in a component.
 * A 9th series is not a generated hue — fold it into "Other".
 */
export const CHART_SERIES = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
] as const;

/** Nth categorical color in fixed order (wraps to the muted step past the ramp). */
export function chartColor(index: number): string {
  return CHART_SERIES[index] ?? 'var(--chart-8)';
}

/** Status hues — reserved, never reused for a categorical "series N". Icon+label always accompany. */
export const STATUS_COLOR = {
  good: 'var(--success)',
  warning: 'var(--warning)',
  critical: 'var(--destructive)',
  neutral: 'var(--muted-foreground)',
} as const;

export type StatusTone = keyof typeof STATUS_COLOR;

/** Directional (financial) semantics — reserved. Up = gain, down = loss. */
export const CHART_UP = 'var(--chart-up)';
export const CHART_DOWN = 'var(--chart-down)';
