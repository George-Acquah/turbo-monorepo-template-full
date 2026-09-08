import type { Linter } from 'eslint';

import fs from 'node:fs';
import path from 'node:path';

import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import eventOwnershipRule from './rules/event-ownership.rule.js';
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

/**
 * Bounded-context isolation, generated from the filesystem rather than
 * hand-maintained — walks modules/* and ports/src/database/schema/* once,
 * at config-load time, so a new module or a new schema/{context} folder is
 * covered automatically.
 *
 * Two things get enforced:
 *
 *  1. modules/{context} may inject its OWN persistence ports
 *     (ports/database/schema/{context}/**) but not another context's.
 *     Reaching into another context's repository port skips that
 *     context's own use cases — same class of violation as a raw
 *     cross-schema DB relation, just one layer up the stack.
 *
 *  2. modules/{context} may not import another module's internals at
 *     all. The only sanctioned cross-context seams are: subscribe to an
 *     event, or call through a public *-application.port.ts (which lives
 *     at ports/{context}/*.port.ts — NOT under database/schema/ — so it's
 *     untouched by either rule below).
 */
function buildContextBoundaryZones(
  repoRoot: string,
): Linter.Config['rules'] extends never ? never : any[] {
  const modulesDir = path.join(repoRoot, 'modules');
  const schemaDir = path.join(repoRoot, 'packages/server/ports/src/database/schema');
  if (!fs.existsSync(modulesDir)) return [];

  const moduleNames = fs
    .readdirSync(modulesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const schemaContexts = fs.existsSync(schemaDir)
    ? fs
        .readdirSync(schemaDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

  // `except` (which would otherwise let one zone say "block ports/database/schema/**
  // except this context's own subfolder") is confirmed non-functional in this
  // ESLint 9 flat-config + eslint-plugin-import@2.32 combination — verified
  // directly: a minimal target/from/except zone still flags imports matching
  // the except pattern. So every context gets one explicit zone per *other*
  // context instead (O(n²), but n is small — ~14 contexts), same workaround
  // already used for buildDatabaseCoreIsolationZones/buildDatabaseClientIsolationZones
  // below, which never used except in the first place for the same reason.
  const persistencePortZones = schemaContexts.flatMap((context) =>
    schemaContexts
      .filter((otherContext) => otherContext !== context)
      .map((otherContext) => ({
        target: `./modules/${context}/**`,
        from: `./packages/server/ports/src/database/schema/${otherContext}/**`,
        message:
          `modules/${context} may only inject its own persistence ports ` +
          `(ports/database/schema/${context}/**), not ${otherContext}'s. Need ` +
          `something from another context? Subscribe to its event, or call ` +
          `through its *-application.port.ts — never its repository ports directly.`,
      })),
  );

  const moduleIsolationZones = moduleNames.flatMap((mod) =>
    moduleNames
      .filter((otherMod) => otherMod !== mod)
      .map((otherMod) => ({
        target: `./modules/${mod}/**`,
        from: `./modules/${otherMod}/**`,
        message:
          `modules/${mod} may not import another module's internals directly ` +
          `(here: modules/${otherMod}). Subscribe to its event, or call ` +
          `through its public application port.`,
      })),
  );

  return [...persistencePortZones, ...moduleIsolationZones];
}

// Walks packages/** and apps/** for package.json dirs (stops descending once
// one is found, so e.g. infrastructure/persistence/{auth,profiles,...} are
// each their own entry, not the non-package group dir above them). Shared by
// both database-core zone builders below so "list every real package in the
// repo" isn't duplicated.
function listPackageDirs(repoRoot: string): string[] {
  const packageDirs: string[] = [];

  function walk(dir: string, rel: string) {
    if (!fs.existsSync(dir)) return;
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      packageDirs.push(rel);
      return;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(path.join(dir, entry.name), `${rel}/${entry.name}`);
    }
  }

  for (const root of ['packages', 'apps']) {
    walk(path.join(repoRoot, root), root);
  }

  return packageDirs;
}

const DATABASE_CORE_ALLOWED_IMPORTERS = new Set([
  'packages/server/infrastructure/databases/core',
  'packages/server/infrastructure/databases/prisma',
  'packages/server/infrastructure/databases/mongo',
  'packages/server/infrastructure/redis',
]);

/**
 * @workspace/databases-core owns the concrete DatabaseHealthService
 * aggregator, DatabaseCoreModule, and TransactionRunner — implementation
 * detail for the three concrete DB client packages, not a general-purpose
 * import. Everyone else should depend on @workspace/ports for
 * DatabaseClient/DatabaseHealthPort/DATABASE_HEALTH_TOKEN instead.
 *
 * Generated (one zone per package, rather than a single
 * `target: './packages/**'` zone) because import/no-restricted-paths'
 * `except` only carves out exemptions on the `from` side, not the `target`
 * side — there's no built-in way to say "block everyone except these 3."
 * Walking the filesystem for package.json dirs, same approach as
 * buildContextBoundaryZones above, keeps this self-maintaining as new
 * packages are added.
 */
function buildDatabaseCoreIsolationZones(repoRoot: string) {
  return listPackageDirs(repoRoot)
    .filter((dir) => {
      if (DATABASE_CORE_ALLOWED_IMPORTERS.has(dir)) {
        return false;
      }

      if (dir.startsWith('packages/server/infrastructure/persistence/')) {
        return false;
      }

      return true;
    })
    .map((dir) => ({
      target: `./${dir}/**`,
      from: [
        './packages/server/infrastructure/databases/core/**',
        './packages/server/infrastructure/databases/core/*',
      ],
      message:
        '@workspace/databases-core is implementation detail for the prisma/mongo/redis client ' +
        'packages. Import DatabaseClient/DatabaseHealthPort/DATABASE_HEALTH_TOKEN from @workspace/ports instead.',
    }));
}

const DATABASE_CLIENT_ALLOWED_IMPORTERS = new Set([
  'packages/server/infrastructure/persistence',
  'packages/server/ports', // defines it, and DatabaseHealthPort's register() signature needs the type
  'packages/server/infrastructure/databases/core', // DatabaseHealthService.register(client: DatabaseClient)
  'packages/server/infrastructure/databases/prisma',
  'packages/server/infrastructure/databases/mongo',
  'packages/server/infrastructure/redis',
]);

/**
 * DatabaseClient is the "implement this to register as a health-checked
 * resource" contract — only the concrete DB client packages should ever
 * implement it. Unlike DATABASE_HEALTH_TOKEN/DatabaseHealthPort (the
 * consumer side — inject + query health status, legitimately needed by e.g.
 * apps/api's HealthController), it has no business being imported anywhere
 * else. It lives at its own subpath, @workspace/ports/database-client
 * (not bundled into the general @workspace/ports/shared barrel), so this
 * can reuse the same file-path-based no-restricted-paths + basePath
 * mechanism as buildDatabaseCoreIsolationZones above, rather than trying to
 * restrict one named export out of a package everyone depends on (a plain
 * `files`-scoped no-restricted-imports config was tried and doesn't work
 * reliably here — each package lints with its own directory as cwd, and
 * flat config's `files` globs, unlike no-restricted-paths' `basePath`
 * option, aren't cwd-independent).
 *
 * `from` covers both the source dir and the built dist output
 * (dist/database-client*) — no-restricted-paths matches an import's
 * *resolved* file, and @workspace/ports/database-client resolves through
 * package.json `exports` to dist/database-client.mjs (plus a
 * content-hashed dist/database-client.port-<hash>.d.mts type chunk), never
 * back to src/, so a source-only pattern silently never matches.
 */
function buildDatabaseClientIsolationZones(repoRoot: string) {
  return listPackageDirs(repoRoot)
    .filter((dir) => !DATABASE_CLIENT_ALLOWED_IMPORTERS.has(dir))
    .map((dir) => ({
      target: `./${dir}/**`,
      from: [
        './packages/server/ports/src/database-client/**',
        './packages/server/ports/dist/database-client*',
      ],
      message:
        'DatabaseClient is the "implement this to register as a health-checked resource" contract ' +
        '— only @workspace/prisma, @workspace/mongo, and @workspace/redis should implement it. ' +
        'Need to check health status instead? Inject DATABASE_HEALTH_TOKEN, typed as ' +
        'DatabaseHealthPort, from @workspace/ports — that stays open to any consumer.',
    }));
}

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
      // Local plugin — no package published, just an inline rule registry.
      // See rules/event-ownership.rule.ts for what it enforces.
      workspace: {
        rules: {
          'event-ownership': eventOwnershipRule,
        },
      },
    },

    // Helps import plugin resolve TS + workspace package exports consistently
    // (requires eslint-import-resolver-typescript installed)
    settings: {
      'import/resolver': {
        typescript: {
          // glob(s) are supported by the resolver (handy for monorepos)
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
      'workspace/event-ownership': 'error',
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
            ...buildContextBoundaryZones(repoRoot),
            ...buildDatabaseCoreIsolationZones(repoRoot),
            ...buildDatabaseClientIsolationZones(repoRoot),
          ],
        },
      ],
    },
  },

  {
    files: ['**/packages/server/ports/**/*.ts', '**/packages/ports/src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
    },
  },
] as Linter.Config[];
