import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  REDIS_PORT_TOKEN,
  type RedisPort,
  DATABASE_HEALTH_TOKEN,
  type DatabaseHealthPort,
} from '@workspace/ports';
import type { DatabaseClient } from '@workspace/ports/database-client';

@Injectable()
export class RedisHealthService implements DatabaseClient, OnModuleInit {
  readonly name = 'redis';

  constructor(
    @Inject(REDIS_PORT_TOKEN) private readonly redis: RedisPort,
    @Inject(DATABASE_HEALTH_TOKEN) private readonly health: DatabaseHealthPort,
  ) {}

  onModuleInit(): void {
    this.health.register(this);
  }

  ping(): Promise<boolean> {
    return this.redis.healthCheck();
  }
}
