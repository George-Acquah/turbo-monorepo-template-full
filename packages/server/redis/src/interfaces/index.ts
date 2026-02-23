import Redis from 'ioredis';

export interface IRedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db: number;
  connectionTimeout?: number;
}

export type RedisClient = Redis;
