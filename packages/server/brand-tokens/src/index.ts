/**
 * Email-safe (HEX) brand palette for consumers that can't render CSS `oklch()`
 * values — Handlebars/MJML email and document templates, primarily.
 *
 * The canonical brand colors live as `oklch()` custom properties under `:root`
 * in `apps/landing/src/styles/theme.css`. Keep the values below in sync with
 * that file by hand when the brand palette changes; this package intentionally
 * has no filesystem/build-time dependency on `apps/landing` so it can be
 * consumed by any server package (including ones pruned into worker/API Docker
 * builds) without dragging the landing app's source into their build context.
 */
export const BRAND_COLORS = {
  background: '#f3f4f6',
  foreground: '#111827',
  primary: '#2563eb',
  'primary-foreground': '#ffffff',
  secondary: '#8b5cf6',
  'secondary-foreground': '#ffffff',
  accent: '#10b981',
  'accent-foreground': '#064e3b',
  surface: '#ffffff',
  'surface-foreground': '#111827',
  muted: '#f9fafb',
  'muted-foreground': '#6b7280',
  border: '#e5e7eb',
  input: '#e5e7eb',
  success: '#16a34a',
  warning: '#d97706',
  destructive: '#dc2626',
} as const;

export type BrandColorName = keyof typeof BRAND_COLORS;
