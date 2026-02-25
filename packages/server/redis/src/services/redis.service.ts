import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { LOGGER_TOKEN, LoggerPort, RedisPort } from '@repo/ports';
import { REDIS_CLIENT } from '@repo/constants';
import type { RedisClient } from '../interfaces';

@Injectable()
export class RedisService implements RedisPort {
  private context = RedisService.name;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClient,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {}

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const data = this.safeStringify(value);

    if (ttlSeconds) {
      await this.redisClient.set(key, data, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, data);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      // fallback for non-JSON strings
      return data as unknown as T;
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
      this.logger.log(`Deleted ${keys.length} Redis keys matching: ${pattern}`, this.context);
    } else {
      this.logger.log(`No Redis keys matched pattern: ${pattern}`, this.context);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redisClient.keys(pattern);
  }

  async flushAll(): Promise<void> {
    await this.redisClient.flushall();
  }

  async publish<T>(channel: string, message: T): Promise<void> {
    const stringMessage = typeof message === 'string' ? message : JSON.stringify(message);
    await this.redisClient.publish(channel, stringMessage);
  }

  async ping(): Promise<string> {
    return this.redisClient.ping();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed', JSON.stringify(error), this.context);
      return false;
    }
  }

  async eval<T>(script: string, keys: string[], args: (string | number)[]): Promise<T> {
    // ioredis style:
    // return this.redisClient.eval(script, keys.length, ...keys, ...args) as any;

    // node-redis v4 style:
    // return this.redisClient.eval(script, { keys, arguments: args.map(String) }) as any;

    return (await this.redisClient.eval(script, keys.length, ...keys, ...args.map(String))) as T;
  }

  private safeStringify<T>(value: T): string {
    return typeof value === 'string'
      ? value
      : JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? Number(v) : v));
  }
}
