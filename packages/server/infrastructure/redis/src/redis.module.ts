import { Module, Global } from '@nestjs/common';
import { REDIS_BULLMQ_CLIENT, REDIS_CLIENT } from '@workspace/constants';
import { DatabaseCoreModule } from '@workspace/databases-core';
import {
  RedisBullMQProvider,
  RedisCacheProvider,
  RedisSubscriberFactoryProvider,
} from './providers/redis.provider';
import { REDIS_PORT_TOKEN, REDIS_SUBSCRIBER_FACTORY_TOKEN } from '@workspace/ports';
import { RedisService } from './services/redis.service';
import { RedisHealthService } from './health';

@Global()
@Module({
  imports: [DatabaseCoreModule],
  providers: [
    RedisBullMQProvider,
    RedisCacheProvider,
    RedisSubscriberFactoryProvider,
    RedisService,
    { provide: REDIS_PORT_TOKEN, useExisting: RedisService },
    RedisHealthService,
  ],
  exports: [REDIS_CLIENT, REDIS_BULLMQ_CLIENT, REDIS_PORT_TOKEN, REDIS_SUBSCRIBER_FACTORY_TOKEN],
})
export class RedisModule {}
