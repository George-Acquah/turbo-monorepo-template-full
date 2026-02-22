import type { Linter } from 'eslint';

import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import { config as baseConfig } from './base.js';

/**
 * A custom ESLint configuration for NestJS services/libraries.
 *
 * Assumptions:
 * - Node.js runtime (Nest backend)
 * - Jest tests are common in Nest projects
 */
export const nestJsConfig = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,

  // Node runtime globals (process, Buffer, __dirname, etc.)
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Jest globals only for test files
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/__tests__/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },

  // Common Nest outputs
  {
    ignores: ['dist/**', 'coverage/**'],
  },
] as Linter.Config[];
