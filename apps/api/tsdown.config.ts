// tsdown.config.ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    main: 'src/main.ts',
  },
  format: ['esm'],
//   target: 'node20',          // pick your runtime (node18/node20)
  dts: false,                // Nest apps typically don’t need dts output
  sourcemap: true,
  clean: true,
  unbundle: true,            // important for Node/Nest: keep deps external
  skipNodeModulesBundle: true,
  external: [/^@types/],
});