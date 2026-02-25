import { Injectable, Inject } from '@nestjs/common';
import { RedisPort, REDIS_PORT_TOKEN } from '@repo/ports';
import * as crypto from 'crypto';

interface OAuthStatePayload {
  provider: string;
  codeVerifier: string;
  returnTo?: string;
}

@Injectable()
export class OAuthStateService {
  private readonly prefix = 'auth:oauth:state';

  constructor(
    @Inject(REDIS_PORT_TOKEN)
    private readonly redis: RedisPort,
  ) {}

  async create(payload: OAuthStatePayload, ttlSeconds = 600): Promise<string> {
    const state = crypto.randomUUID();

    await this.redis.set(`${this.prefix}:${state}`, payload, ttlSeconds);

    return state;
  }

  async consume(state: string): Promise<OAuthStatePayload | null> {
    const key = `${this.prefix}:${state}`;

    const data = await this.redis.get<OAuthStatePayload>(key);
    if (!data) return null;

    await this.redis.del(key);
    return data;
  }
}
