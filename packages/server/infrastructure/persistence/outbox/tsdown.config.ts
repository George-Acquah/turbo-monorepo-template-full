import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/outbox-persistence.module.ts',
  },
  format: ['esm'],
  dts: true,
  unbundle: false,
  clean: true,
  skipNodeModulesBundle: true,
  external: [/^@types/],
  exports: true,
});
