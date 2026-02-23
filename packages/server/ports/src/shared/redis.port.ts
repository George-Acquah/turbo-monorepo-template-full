// libs/ports/src/cache/cache.port.ts

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
}

export const REDIS_PORT_TOKEN = Symbol('REDIS_PORT_TOKEN');
