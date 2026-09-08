import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function findRepoRoot(startDir) {
  let dir = startDir;
  while (true) {
    if (
      existsSync(join(dir, 'pnpm-workspace.yaml')) ||
      existsSync(join(dir, 'turbo.json')) ||
      existsSync(join(dir, '.git'))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = findRepoRoot(__dirname);
const modulesDir = join(repoRoot, 'modules');

/** Resolves a module package's main entry file from its own package.json — avoids hardcoding "dist/index.mjs". */
function resolveEntryFile(moduleDir) {
  const pkgPath = join(moduleDir, 'package.json');
  if (!existsSync(pkgPath)) return null;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const rootExport = pkg.exports?.['.'];
  const relative =
    typeof rootExport === 'string'
      ? rootExport
      : (rootExport?.import ?? rootExport?.default ?? pkg.module ?? pkg.main);

  return relative ? join(moduleDir, relative) : null;
}

/**
 * Auto-discovers every bounded-context module's `{context}Subscriptions` +
 * `{context}Produces` exports — no hand-maintained list, and no dependency
 * list either: each module is imported by its built file path
 * (`modules/{context}/<its own package.json's entry>`), not by bare package
 * specifier, so this script never needs `@workspace/{context}` added as a
 * dependency of `@workspace/events` — pnpm's node_modules resolution never
 * enters the picture for a `file://` import.
 *
 * Requires each module package to be built first (`pnpm --filter
 * @workspace/{context} build`) — this is a plain Node import of compiled
 * dist output, not a TS/ts-node run.
 */
export async function discoverModuleEvents() {
  const contexts = existsSync(modulesDir)
    ? readdirSync(modulesDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

  const results = [];

  for (const context of contexts) {
    const moduleDir = join(modulesDir, context);
    const entryFile = resolveEntryFile(moduleDir);

    if (!entryFile || !existsSync(entryFile)) {
      console.warn(
        `[discover-module-events] Skipping ${context}: no built entry file found (run ` +
          `\`pnpm --filter @workspace/${context} build\` first if this module should be included).`,
      );
      continue;
    }

    let mod;
    try {
      mod = await import(pathToFileURL(entryFile).href);
    } catch (err) {
      console.warn(`[discover-module-events] Skipping ${context}: ${err.message}`);
      continue;
    }

    results.push({
      context,
      entryFile,
      subscriptions: mod[`${context}Subscriptions`] ?? null,
      produces: mod[`${context}Produces`] ?? [],
    });
  }

  return results;
}
