import { Provider } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS_BULLMQ_CLIENT, REDIS_CLIENT } from '@workspace/constants';
import { REDIS_RUNTIME_CONFIG_TOKEN, type RedisRuntimeConfig } from '@workspace/ports/config';
import {
  LOGGER_TOKEN,
  LoggerPort,
  REDIS_SUBSCRIBER_FACTORY_TOKEN,
  type RedisSubscriberClient,
  type RedisSubscriberFactory,
} from '@workspace/ports';

const getBaseOptions = (config: RedisRuntimeConfig): RedisOptions => {
  const { connectionTimeout, host, port, password, tls } = config;

  return {
    host,
    port,
    password,
    enableReadyCheck: false,
    ...(tls ? { tls: {} } : {}),
    connectTimeout: connectionTimeout,
  };
};

export const RedisCacheProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [REDIS_RUNTIME_CONFIG_TOKEN, LOGGER_TOKEN],
  useFactory: (cfg: RedisRuntimeConfig, logger: LoggerPort) => {
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
  inject: [REDIS_RUNTIME_CONFIG_TOKEN, LOGGER_TOKEN],
  useFactory: (cfg: RedisRuntimeConfig, logger: LoggerPort) => {
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

// ── Subscriber client factory ────────────────────────────────────────────────
// ioredis clients that have called subscribe/psubscribe enter a dedicated mode
// where they can no longer issue regular commands.  SseService creates one
// subscriber connection per API pod via this factory so the shared REDIS_CLIENT
// instance is never polluted.

export const RedisSubscriberFactoryProvider: Provider = {
  provide: REDIS_SUBSCRIBER_FACTORY_TOKEN,
  inject: [REDIS_RUNTIME_CONFIG_TOKEN, LOGGER_TOKEN],
  useFactory: (cfg: RedisRuntimeConfig, logger: LoggerPort): RedisSubscriberFactory => ({
    create(): RedisSubscriberClient {
      const redisOptions: RedisOptions = {
        ...getBaseOptions(cfg),
        // null = retry forever (subscriber must stay connected)
        maxRetriesPerRequest: null,
        retryStrategy: (times) => Math.min(times * 500, 10_000),
        enableReadyCheck: false,
      };
      const { url } = cfg;
      const client = url ? new Redis(url, redisOptions) : new Redis(redisOptions);
      client.on('error', (err) =>
        logger.error(`Redis subscriber error: ${err.message}`, 'RedisSubscriberClient'),
      );
      client.on('connect', () =>
        logger.log('Successfully connected to Redis [SUBSCRIBER] instance'),
      );
      return client as unknown as RedisSubscriberClient;
    },
  }),
};
