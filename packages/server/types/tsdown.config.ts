import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    interfaces: 'src/interfaces/index.ts',
    enums: 'src/enums/index.ts',
    events: 'src/events/index.ts',
    domain: 'src/domain/index.ts',
    express: 'src/express.ts',
  },
  format: ['esm'],
  dts: true,
  unbundle: false,
  clean: true,
  skipNodeModulesBundle: true,
  external: ['class-validator', 'class-transformer', '@nestjs/common', 'express', /^@types/],
  exports: true,
});
