/**
 * Returns the current timestamp.
 */
export function now(): Date {
  return new Date();
}

/**
 * Returns the current Unix timestamp in milliseconds.
 */
export function nowMs(): number {
  return Date.now();
}

/**
 * Returns the current Unix timestamp in seconds.
 */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
