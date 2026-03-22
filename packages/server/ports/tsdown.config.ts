import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    audit: 'src/audit/index.ts',
    database: 'src/database/index.ts',
    email: 'src/email/index.ts',
    events: 'src/events/index.ts',
    http: 'src/http/index.ts',
    payments: 'src/payments/index.ts',
    storage: 'src/storage/index.ts',
    shared: 'src/shared/index.ts',
  },
  format: ['esm'],
  dts: true,
  unbundle: false,
  clean: true,
  skipNodeModulesBundle: true,
  external: [/^@types/],
  exports: true,
});
