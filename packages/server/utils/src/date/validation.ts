/**
 * Returns true if the supplied value is a valid Date instance.
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Asserts that the supplied value is a valid Date.
 *
 * Throws a TypeError otherwise.
 */
export function assertDate(value: unknown, name = 'value'): asserts value is Date {
  if (!isValidDate(value)) {
    throw new TypeError(`${name} must be a valid Date instance.`);
  }
}
