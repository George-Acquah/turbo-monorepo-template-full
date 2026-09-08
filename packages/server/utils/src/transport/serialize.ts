import type { TransportSerialized } from '@workspace/types';

function isSeen(seen: WeakMap<object, unknown>, value: object): boolean {
  return seen.has(value);
}

function serialize(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map((v) => serialize(v, seen));
  }

  if (value instanceof Set) {
    return Array.from(value, (v) => serialize(v, seen));
  }

  if (value instanceof Map) {
    return Array.from(value.entries(), ([k, v]) => [serialize(k, seen), serialize(v, seen)]);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (isSeen(seen, value)) {
    return seen.get(value);
  }

  const proto = Object.getPrototypeOf(value);
  const target = Object.create(proto ?? null) as Record<string, unknown>;

  seen.set(value, target);

  for (const [k, v] of Object.entries(value)) {
    target[k] = serialize(v, seen);
  }

  return target;
}

export function serializeForTransport<T>(value: T): TransportSerialized<T> {
  return serialize(value, new WeakMap<object, unknown>()) as TransportSerialized<T>;
}
