import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    actions: 'src/actions/index.ts',
    logger: 'src/logger/index.ts',
    validation: 'src/validation/index.ts',
    utils: 'src/utils/index.ts',
  },
  format: ['esm'],
  dts: true,
  unbundle: false,
  clean: true,
  skipNodeModulesBundle: true,
  external: [/^@types/, /^@repo\//, 'zod'],
  exports: true,
});
