import type { TransportSerialized } from '@repo/types';

function hasSeen(seen: WeakMap<object, unknown>, value: object): boolean {
  return seen.has(value);
}

function serializeValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item, seen));
  }

  if (value instanceof Set) {
    return Array.from(value, (item) => serializeValue(item, seen));
  }

  if (value instanceof Map) {
    return Array.from(value.entries(), ([key, entryValue]) => [
      serializeValue(key, seen),
      serializeValue(entryValue, seen),
    ]);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (hasSeen(seen, value)) {
    return seen.get(value);
  }

  const prototype = Object.getPrototypeOf(value);
  const target = Object.create(prototype === null ? null : prototype) as Record<string, unknown>;

  seen.set(value, target);

  for (const [key, entryValue] of Object.entries(value)) {
    target[key] = serializeValue(entryValue, seen);
  }

  return target;
}

export function serializeForTransport<T>(value: T): TransportSerialized<T> {
  return serializeValue(value, new WeakMap<object, unknown>()) as TransportSerialized<T>;
}
