import { Provider } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS_BULLMQ_CLIENT, REDIS_CLIENT } from '@repo/constants';
import { LOGGER_TOKEN, LoggerPort } from '@repo/ports';
import { RedisConfig } from '../configs/redis.config';

const getBaseOptions = (config: ConfigType<typeof RedisConfig>): RedisOptions => {
  const { connectionTimeout, host, port, password } = config;

  return {
    host,
    port,
    password,
    enableReadyCheck: false,
    // tls,
    connectTimeout: connectionTimeout,
  };
};

export const RedisCacheProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [RedisConfig.KEY, LOGGER_TOKEN],
  useFactory: (cfg: ConfigType<typeof RedisConfig>, logger: LoggerPort) => {
    const loggerContext = 'RedisCacheProvider';

    if (!cfg) {
      logger.warn('No redis config found in DI', loggerContext);
      return;
    }
    const redisOptions: RedisOptions = {
      ...getBaseOptions(cfg),
      maxRetriesPerRequest: 3, // Fail after 3 tries
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 2000)),
    };
    const { url } = cfg;

    const client = url ? new Redis(url, redisOptions) : new Redis(redisOptions);

    client.on('error', (err) => logger.error(`Redis connection error: ${err.message}`));
    client.on('connect', () => logger.log('Successfully connected to Redis [CACHE] instance'));

    return client;
  },
};

export const RedisBullMQProvider: Provider = {
  provide: REDIS_BULLMQ_CLIENT,
  inject: [RedisConfig.KEY, LOGGER_TOKEN],
  useFactory: (cfg: ConfigType<typeof RedisConfig>, logger: LoggerPort) => {
    const loggerContext = 'RedisBullMQProvider';

    if (!cfg) {
      logger.warn('No redis config found in DI', loggerContext);
      return;
    }
    const redisOptions: RedisOptions = {
      ...getBaseOptions(cfg),
      maxRetriesPerRequest: null, // Required by BullMQ
      retryStrategy: (times) => Math.min(times * 500, 10000), // Exponential backoff
    };
    const { url } = cfg;

    const client = url ? new Redis(url, redisOptions) : new Redis(redisOptions);

    client.on('error', (err) => logger.error(`Redis connection error: ${err.message}`));
    client.on('connect', () => logger.log('Successfully connected to Redis [BULLMQ] instance'));
    return client;
  },
};
