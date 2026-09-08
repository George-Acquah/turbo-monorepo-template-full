import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/notifications-persistence.module.ts',
  },
  format: ['esm'],
  dts: true,
  unbundle: false,
  clean: true,
  skipNodeModulesBundle: true,
  external: [/^@types/],
  exports: true,
});
