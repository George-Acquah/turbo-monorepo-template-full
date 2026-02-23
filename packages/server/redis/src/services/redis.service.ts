import { Inject } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { RedisPort } from '@repo/ports';
import { REDIS_CLIENT } from '../constants/redis.constants';
import type { RedisClient } from '../interfaces';

@Injectable()
export class RedisService implements RedisPort {
  private logger = new Logger(RedisService.name);

  // eslint-disable-next-line no-unused-vars
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: RedisClient) {}

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
      this.logger.log(`Deleted ${keys.length} Redis keys matching: ${pattern}`);
    } else {
      this.logger.log(`No Redis keys matched pattern: ${pattern}`);
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
      this.logger.error('Redis health check failed', error);
      return false;
    }
  }

  private safeStringify<T>(value: T): string {
    return typeof value === 'string'
      ? value
      : JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? Number(v) : v));
  }
}
