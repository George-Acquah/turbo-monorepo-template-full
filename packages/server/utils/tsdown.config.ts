import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    date: 'src/date/index.ts',
    string: 'src/string/index.ts',
    number: 'src/number/index.ts',
    request: 'src/response-lifecycle/index.ts',
  },
  format: ['esm'],
  dts: true,
  unbundle: false,
  clean: true,
  skipNodeModulesBundle: true,
  external: [/^@types/, 'decimal.js', 'date-fns', 'date-fns-tz'],
  exports: true,
});
