import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    jest: 'src/jest/index.ts',
    helpers: 'src/helpers/index.ts',
    time: 'src/time/index.ts',
    mocks: 'src/mocks/index.ts',
    nest: 'src/nest/index.ts',
    database: 'src/database/index.ts',
    infrastructure: 'src/infrastructure/index.ts',
  },
  format: ['esm'],
  dts: true,
  unbundle: false,
  clean: true,
  skipNodeModulesBundle: true,
  external: ['@jest/globals', '@nestjs/common', '@nestjs/core', '@nestjs/testing', /^@types/],
  exports: true,
});
