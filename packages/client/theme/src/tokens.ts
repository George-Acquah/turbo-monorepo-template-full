/**
 * JS-side mirror of the CSS custom properties in `./tokens.css`, for
 * consumers that need actual values rather than `var(--x)` references —
 * chart color arrays, canvas drawing, inline SVG. Keep in sync by hand;
 * there are few enough tokens here that generating this from the CSS
 * isn't worth the tooling yet.
 */

/** 8-color categorical ramp, light mode. Order matches `--chart-1..8`. */
export const chartColors = [
  'oklch(0.6 0.19 250)',
  'oklch(0.68 0.16 155)',
  'oklch(0.75 0.15 85)',
  'oklch(0.62 0.2 25)',
  'oklch(0.62 0.17 300)',
  'oklch(0.68 0.14 200)',
  'oklch(0.58 0.15 340)',
  'oklch(0.55 0.02 250)',
] as const;

export const semanticColors = {
  success: 'oklch(0.65 0.16 150)',
  warning: 'oklch(0.8 0.15 85)',
  destructive: 'oklch(0.6 0.22 25)',
  info: 'oklch(0.62 0.16 235)',
} as const;

export const radius = {
  sm: 'calc(var(--radius) - 6px)',
  md: 'calc(var(--radius) - 3px)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 6px)',
} as const;

export const density = {
  compact: 0.75,
  comfortable: 1,
  relaxed: 1.25,
} as const;

export type Density = keyof typeof density;

export const fontFamily = {
  sans: 'var(--font-sans)',
  heading: 'var(--font-heading)',
  mono: 'var(--font-mono)',
} as const;
