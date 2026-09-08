export abstract class RedisPort {
  abstract set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  abstract get<T>(key: string): Promise<T | null>;
  abstract del(key: string): Promise<void>;
  abstract delByPattern(pattern: string): Promise<void>;
  abstract keys(pattern: string): Promise<string[]>;
  abstract flushAll(): Promise<void>;
  abstract publish<T>(channel: string, message: T): Promise<void>;
  abstract ping(): Promise<string>;
  abstract healthCheck(): Promise<boolean>;

  abstract eval<T = unknown>(script: string, keys: string[], args: (string | number)[]): Promise<T>;

  /** Atomically increments the integer stored at `key` and returns the new value. */
  abstract incr(key: string): Promise<number>;

  /**
   * Sets `key` to `value` only if it does not already exist, with a TTL.
   * Returns true if the value was set (i.e. the lock was acquired).
   */
  abstract setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>;

  /** Sets/refreshes the expiry on an existing key. */
  abstract expire(key: string, ttlSeconds: number): Promise<void>;
}

export const REDIS_PORT_TOKEN = Symbol('REDIS_PORT_TOKEN');

// ── Subscriber factory token ────────────────────────────────────────────────
// Injected into SseService to create a dedicated ioredis subscriber connection.
// Using a factory (not the RedisPort singleton) because an ioredis client in
// subscribe mode cannot be used for any other commands.
export const REDIS_SUBSCRIBER_FACTORY_TOKEN = Symbol('REDIS_SUBSCRIBER_FACTORY_TOKEN');

/** Creates a fresh ioredis client wired for subscribe/psubscribe mode. */
export interface RedisSubscriberFactory {
  create(): RedisSubscriberClient;
}

/** Minimal interface for an ioredis client in subscriber mode. */
export interface RedisSubscriberClient {
  psubscribe(pattern: string): Promise<void>;
  on(
    event: 'pmessage',
    listener: (pattern: string, channel: string, message: string) => void,
  ): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this;
  quit(): Promise<string>;
}
