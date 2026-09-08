export type RedactMaskFunction = (key: string, value: unknown) => unknown;

export interface RedactOptions {
  keys?: (string | RegExp)[];
  mask?: string | RedactMaskFunction;
}

const DEFAULT_SENSITIVE_KEYS: (string | RegExp)[] = [
  'password',
  'token',
  'secret',
  'credential',
  'passcode',
  'api_key',
  'apikey',
  'authorization',
  /^x-api-key$/i,
  /^ssn$/i,
];

function isMatch(key: string, patterns: (string | RegExp)[]): boolean {
  return patterns.some((p) =>
    typeof p === 'string' ? key.toLowerCase().includes(p.toLowerCase()) : p.test(key),
  );
}

function cloneAndRedact(
  value: unknown,
  key: string | undefined,
  seen: WeakMap<object, unknown>,
  options: Required<RedactOptions>,
): unknown {
  if (key && isMatch(key, options.keys)) {
    return typeof options.mask === 'function' ? options.mask(key, value) : options.mask;
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (ArrayBuffer.isView(value)) {
    return '[Binary Data]';
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  if (Array.isArray(value)) {
    const arr: unknown[] = [];
    seen.set(value, arr);

    for (const item of value) {
      arr.push(cloneAndRedact(item, undefined, seen, options));
    }

    return arr;
  }

  if (value instanceof Set) {
    const set = new Set();
    seen.set(value, set);

    for (const item of value) {
      set.add(cloneAndRedact(item, undefined, seen, options));
    }

    return set;
  }

  if (value instanceof Map) {
    const map = new Map();
    seen.set(value, map);

    for (const [k, v] of value.entries()) {
      map.set(k, cloneAndRedact(v, typeof k === 'string' ? k : undefined, seen, options));
    }

    return map;
  }

  const result: Record<string, unknown> = {};
  seen.set(value, result);

  for (const [k, v] of Object.entries(value)) {
    result[k] = cloneAndRedact(v, k, seen, options);
  }

  return result;
}

export function redact<T>(value: T, options?: RedactOptions): T {
  const merged: Required<RedactOptions> = {
    keys: options?.keys ?? DEFAULT_SENSITIVE_KEYS,
    mask: options?.mask ?? '[REDACTED]',
  };

  return cloneAndRedact(value, undefined, new WeakMap(), merged) as T;
}
