import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // pnpm hoists shared/transitive deps into the monorepo-root .pnpm store, not into
  // apps/landing/node_modules. Without this, Next's output file tracing scopes itself to
  // apps/landing and misses those files.
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  // Next's file tracer statically references @opentelemetry/api via a conditional require even
  // though it's never installed (pnpm skips it as an unneeded optional dep). Excluding it tells
  // the tracer this is a known false positive, not a missing dependency.
  outputFileTracingExcludes: {
    '*': ['node_modules/.pnpm/@opentelemetry+api@*/**', 'node_modules/@opentelemetry/**'],
  },
};

export default nextConfig;
