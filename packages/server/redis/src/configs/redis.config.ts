import { ConfigService, registerAs } from '@nestjs/config';
import { redisConfigKey } from '@repo/constants';
import { IRedisConfig } from '../interfaces';

export const redisConfig = (config: ConfigService): IRedisConfig => ({
  url: config.get<string>('REDIS_URL'),
  host: config.get<string>('REDIS_HOST'),
  port: config.get<number>('REDIS_PORT', 6379),
  password: config.get<string>('REDIS_PASSWORD'),
  db: config.get<number>('REDIS_DB', 0),
  connectionTimeout: Number(config.get<string>('REDIS_CONNECTION_TIMEOUT', '30000')),
});

export const RedisConfig = registerAs(redisConfigKey, () => redisConfig);
