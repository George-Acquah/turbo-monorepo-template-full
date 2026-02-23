import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    queues: 'src/queues/index.ts',
  },
  format: ['esm'],
  dts: true,
  unbundle: false,
  clean: true,
  skipNodeModulesBundle: true,
  external: [/^@types/],
  exports: true,
});
