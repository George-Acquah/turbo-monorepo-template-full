/**
 * Public environment. Everything here is safe in the browser bundle.
 */
export const env = {
  /** This app's own public origin (canonical URLs, OG, JSON-LD). */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001',
} as const;
