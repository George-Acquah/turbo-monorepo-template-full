'server only';

/**
 * Server environment config. keep
 * secrets strictly in this file as it is not included in the client-side bundle.
 */
export const serverEnv = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/+$/, ''),
  // Shared secret for apps/api's OriginAuthMiddleware (X-Origin-Auth header).
  // Only read here (server.ts, RSC/server actions) — never in shared/config/env.ts,
  // which is the browser-side config. Sending this from the browser client
  // (shared/api/client.ts) would ship the secret into the JS bundle.
  originAuthSecret: process.env.ORIGIN_AUTH_SECRET?.replace(/\s+/g, ''),
  // Registrable-domain scope for the auth cookies (see shared/lib/cookies.ts) so
  // they're also sent to api.example.com. Deliberately its own env var, never
  // derived from `environment`/NODE_ENV: Vercel Preview deployments run with
  // NODE_ENV=production too but live on *.vercel.app, a different registrable
  // domain — a `Domain=.example.com` cookie from a *.vercel.app response would
  // be rejected by the browser. Only set in the real Vercel Production env.
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  environment:
    process.env.NODE_ENV === 'production'
      ? 'production'
      : process.env.NODE_ENV === 'test'
        ? 'test'
        : 'development',
} as const;
