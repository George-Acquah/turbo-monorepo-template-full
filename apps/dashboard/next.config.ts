import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // pnpm hoists shared/transitive deps only into the monorepo-root .pnpm store, not into
  // apps/members/node_modules. Without this, Next's output file tracing scopes itself to
  // apps/members and misses those files.
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  // Next's built-in (optional, unused here) tracing/instrumentation support makes its file
  // tracer statically reference @opentelemetry/api via a conditional require, even though it's
  // never actually installed (pnpm correctly skips it as an unneeded optional dep). No
  // `outputFileTracingRoot` value fixes this — the file genuinely doesn't exist on disk — so
  // `vercel deploy --prebuilt` fails validating a traced reference to a file that was never
  // real. Excluding it tells the tracer this is a known false positive, not a missing dependency.
  outputFileTracingExcludes: {
    '*': ['node_modules/.pnpm/@opentelemetry+api@*/**', 'node_modules/@opentelemetry/**'],
  },
  // Client packages ship raw TS/TSX source (no build step) — Next must transpile them.
  transpilePackages: [
    '@workspace/client-theme',
    '@workspace/client-turnstile',
    '@workspace/client-ui-primitives',
    '@workspace/client-ui-forms',
    '@workspace/client-ui-overlays',
    '@workspace/client-ui-table',
    '@workspace/client-ui-pagination',
    '@workspace/client-ui-charts',
  ],
};

export default nextConfig;
