import type { Linter } from 'eslint';

import fs from 'node:fs';
import path from 'node:path';

import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
// import 'eslint-plugin-only-warn';

function findRepoRoot(startDir: string) {
  let dir = startDir;

  while (true) {
    const hasPnpmWorkspace = fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'));
    const hasTurbo = fs.existsSync(path.join(dir, 'turbo.json'));
    const hasGit = fs.existsSync(path.join(dir, '.git'));

    if (hasPnpmWorkspace || hasTurbo || hasGit) return dir;

    const parent = path.dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

const repoRoot = findRepoRoot(process.cwd());

export const config = [
  // make ignores repo-wide
  { ignores: ['**/dist/**'] },

  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,

  {
    plugins: {
      turbo: turboPlugin,
      import: importPlugin,
    },

    // Helps import plugin resolve TS + workspace package exports consistently
    // (requires eslint-import-resolver-typescript installed)
    settings: {
      'import/resolver': {
        typescript: {
          // glob(s) are supported by the resolver (handy for monorepos) :contentReference[oaicite:1]{index=1}
          project: [
            './tsconfig.json',
            './apps/*/tsconfig.json',
            './packages/**/tsconfig.json',
            './packages/**/tsconfig.*.json',
          ],
          alwaysTryTypes: true,
        },
        node: {
          extensions: ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.tsx', '.d.ts'],
        },
      },
    },

    rules: {
      'turbo/no-undeclared-env-vars': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      // 'prettier/prettier': 'error',

      'import/no-restricted-paths': [
        'error',
        {
          // basePath defaults to cwd; set it so zones are stable :contentReference[oaicite:2]{index=2}
          basePath: repoRoot,
          zones: [
            {
              target: './packages/**',
              from: './apps/**',
              message: 'Packages must not import from apps.',
            },
            {
              target: './packages/server/**',
              from: './packages/client/**',
              message: 'Server packages must not import from client packages.',
            },
            {
              target: './packages/client/**',
              from: './packages/server/**',
              message: 'Client packages must not import from server packages.',
            },
          ],
        },
      ],
    },
  },

{
  files: [
    '**/packages/server/ports/**/*.ts',
    '**/packages/ports/src/**/*.ts',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',
  },
}
] as Linter.Config[];
