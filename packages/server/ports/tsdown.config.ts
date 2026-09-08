import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    database: 'src/database/index.ts',
    'database-client': 'src/database-client/index.ts',
    email: 'src/email/index.ts',
    events: 'src/events/index.ts',
    http: 'src/http/index.ts',
    payments: 'src/payments/index.ts',
    storage: 'src/storage/index.ts',
    shared: 'src/shared/index.ts',
    whatsapp: 'src/whatsapp/index.ts',
    config: 'src/config/index.ts',
  },
  format: ['esm'],
  dts: true,
  unbundle: false,
  clean: true,
  skipNodeModulesBundle: true,
  external: [/^@types/],
  exports: true,
});
