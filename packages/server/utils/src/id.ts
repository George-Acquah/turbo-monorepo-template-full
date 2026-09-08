// packages/utils/src/id.ts
// ─────────────────────────────────────────────────────────────────────────────
// workspace — Centralised ID generation
//
// Uses cuid2 (collision-resistant, time-sortable, URL-safe).
// Why cuid2 over UUID v7?
//   - cuid2 is time-sortable like UUID v7 (good for index locality)
//   - Shorter by default (24 chars vs 36 with dashes)
//   - The prefix pattern (inv_abc123) is far more debuggable in logs/support
//   - No runtime uuid library needed — cuid2 is our single ID primitive
//
// The ID_PREFIXES constant in constants.ts defines all allowed prefixes.
// Always use a prefix for domain entities. Omit prefix only for ephemeral
// records where the type is irrelevant (e.g. raw log entries).
// ─────────────────────────────────────────────────────────────────────────────

import { IdPrefix, JobName, QueueName } from '@workspace/constants';
import { generateId, stripIdPrefix, isValidId } from './cuid';

/**
 * Generates a deterministic idempotency key string.
 *
 * @param prefix - Optional QueueName or JobName prefix
 * @param aggregateId - Optional Aggregate ID
 * @returns A unique deterministic idempotency key string: "queue_name:aggregate_id"
 *
 * @example
 * generateIdempotencyKey(QueueNames.REMINDER_EXECUTION, "reminder_id");
 */
export const generateIdempotencyKey = (
  prefix: QueueName | JobName,
  aggregateId: string,
): string => {
  return `${prefix}:${aggregateId}`;
};

/**
 * Type-safe ID factory bound to a specific prefix.
 * Use this to create per-model ID generators so call sites never
 * need to remember which prefix belongs to which model.
 *
 * @example
 * // In modules/academics/student.entity.ts
 * import { makeIdFactory } from '@workspace/utils';
 * import { ID_PREFIXES } from '@workspace/database/constants';
 *
 * export const generateStudentId = makeIdFactory(ID_PREFIXES.STUDENT);
 * // Usage: generateStudentId() → "stu_clhqx8y7z0000xyz..."
 */
/**
 * Backwards-compatible simple ID factory.
 * Prefer `createIdentifier()` which returns a richer helper object.
 */
export const makeIdFactory = (prefix: IdPrefix) => (): string => generateId(prefix);

/**
 * Rich identifier creator returning helpful utilities per-prefix.
 * Example:
 *
 * const UserId = createIdentifier(ID_PREFIXES.USER);
 * UserId.generate();
 * UserId.is('usr_...');
 * UserId.assert('usr_...');
 * UserId.strip('usr_...');
 */
export const createIdentifier = (prefix: IdPrefix) => {
  const generate = () => generateId(prefix);

  const is = (id: unknown): id is string => {
    if (typeof id !== 'string') return false;
    if (!isValidId(id)) return false;
    const parts = id.split('_');
    return parts.length > 1 ? (parts[0] === prefix) : false;
  };

  const assert = (id: unknown): asserts id is string => {
    if (!is(id)) {
      throw new TypeError(`Invalid ${prefix} id: ${String(id)}`);
    }
  };

  const strip = (id: string) => stripIdPrefix(id);

  return {
    prefix,
    generate,
    is,
    assert,
    strip,
  } as const;
};

/**
 * Extracts the prefix from a prefixed ID.
 * Returns undefined if the ID has no prefix.
 *
 * @example
 * getIdPrefix('stu_clhqx8y7z0000xyz...') // "stu"
 * getIdPrefix('clhqx8y7z0000xyz...')      // undefined
 */
export const getIdPrefix = (id: string): IdPrefix | undefined => {
  const parts = id.split('_');
  return parts.length > 1 ? (parts[0] as IdPrefix) : undefined;
};

/**
 * Checks whether an ID matches the expected prefix.
 * Use in validation layers to catch misrouted IDs early.
 *
 * @example
 * assertIdPrefix('stu_abc', 'stu') // returns true
 * assertIdPrefix('inv_abc', 'stu') // throws TypeError in strict mode
 */
export const isIdPrefix = (id: string, expectedPrefix: IdPrefix): boolean => {
  return id.startsWith(`${expectedPrefix}_`);
};
