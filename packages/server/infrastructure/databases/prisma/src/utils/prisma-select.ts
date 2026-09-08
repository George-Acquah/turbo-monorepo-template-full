import type { EntitySelectPath } from '@workspace/ports';

/**
 * Translates a port-level `select` array (flat keys or one-level-deep dotted
 * relation paths, e.g. ['id','email','preferences.currency']) into a nested
 * Prisma `select` object. Returns undefined when no select is given — Prisma
 * then defaults to selecting all scalar fields.
 *
 * Lives here (not in a persistence package) because it's generic over any
 * entity shape and every Prisma-backed persistence package needs it —
 * duplicating it per package would drift.
 */
export function buildPrismaSelect<P extends object, K extends keyof P = keyof P>(
  select?: readonly (K | EntitySelectPath<P>)[],
): Record<string, unknown> | undefined {
  if (!select || select.length === 0) return undefined;

  const result: Record<string, unknown> = {};

  for (const path of select) {
    const [head, ...rest] = String(path).split('.');
    if (!head) continue;

    if (rest.length === 0) {
      result[head] = true;
      continue;
    }

    const existing = result[head] as { select?: Record<string, unknown> } | undefined;
    result[head] = {
      select: { ...(existing?.select ?? {}), [rest.join('.')]: true },
    };
  }

  return result;
}
