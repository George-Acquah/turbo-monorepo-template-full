import { Module, Global } from '@nestjs/common';
import { REDIS_BULLMQ_CLIENT, REDIS_CLIENT } from '@repo/constants';
import { ConfigModule } from '@nestjs/config';
import { RedisConfig } from './configs/redis.config';
import { RedisBullMQProvider, RedisCacheProvider } from './providers/redis.provider';
import { REDIS_PORT_TOKEN } from '@repo/ports';
import { RedisService } from './services/redis.service';

@Global()
@Module({
  imports: [ConfigModule.forFeature(RedisConfig)],
  providers: [
    RedisBullMQProvider,
    RedisCacheProvider,
    RedisService,
    { provide: REDIS_PORT_TOKEN, useExisting: RedisService },
  ],
  exports: [REDIS_CLIENT, REDIS_BULLMQ_CLIENT, REDIS_PORT_TOKEN],
})
export class RedisModule {}
