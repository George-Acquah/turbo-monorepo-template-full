// redis.config.ts
import { registerAs } from '@nestjs/config';

export const RedisConfigKey = 'REDIS_CONFIG';

export const RedisConfig = registerAs(RedisConfigKey, () => ({
  url: process.env.REDIS_URL,
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB ?? 0),
  connectionTimeout: Number(process.env.REDIS_CONNECTION_TIMEOUT ?? 30000),
  tls: (process.env.REDIS_TLS ?? 'false') === 'true',
}));
