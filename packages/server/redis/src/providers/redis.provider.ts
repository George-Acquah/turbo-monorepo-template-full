import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS_BULLMQ_CLIENT, REDIS_CLIENT, redisConfigKey } from '@repo/constants';
import { IRedisConfig } from '../interfaces';
import { LOGGER_TOKEN, LoggerPort } from '@repo/ports';

const getBaseOptions = (config: IRedisConfig): RedisOptions => {
  const { connectionTimeout, host, port, password } = config;

  return {
    host,
    port,
    password,
    enableReadyCheck: false,
    connectTimeout: connectionTimeout,
  };
};

export const RedisCacheProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService, LOGGER_TOKEN],
  useFactory: (config: ConfigService, logger: LoggerPort) => {
    const loggerContext = 'RedisCacheProvider';
    const redisConfig = config.get<IRedisConfig>(redisConfigKey);

    if (!redisConfig) {
      logger.warn('No redis config found in DI', loggerContext);
      return;
    }
    const redisOptions: RedisOptions = {
      ...getBaseOptions(redisConfig),
      maxRetriesPerRequest: 3, // Fail after 3 tries
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 2000)),
    };
    const { url } = redisConfig;

    const client = url ? new Redis(url, redisOptions) : new Redis(redisOptions);

    client.on('error', (err) => logger.error(`Redis connection error: ${err.message}`));
    client.on('connect', () => logger.log('Successfully connected to Redis [CACHE] instance'));

    return client;
  },
};

export const RedisBullMQProvider: Provider = {
  provide: REDIS_BULLMQ_CLIENT,
  inject: [ConfigService, LOGGER_TOKEN],
  useFactory: (config: ConfigService, logger: LoggerPort) => {
    const loggerContext = 'RedisBullMQProvider';
    const redisConfig = config.get<IRedisConfig>(redisConfigKey);

    if (!redisConfig) {
      logger.warn('No redis config found in DI', loggerContext);
      return;
    }
    const redisOptions: RedisOptions = {
      ...getBaseOptions(redisConfig),
      maxRetriesPerRequest: null, // Required by BullMQ
      retryStrategy: (times) => Math.min(times * 500, 10000), // Exponential backoff
    };
    const { url } = redisConfig;

    const client = url ? new Redis(url, redisOptions) : new Redis(redisOptions);

    client.on('error', (err) => logger.error(`Redis connection error: ${err.message}`));
    client.on('connect', () => logger.log('Successfully connected to Redis [BULLMQ] instance'));
    return client;
  },
};
