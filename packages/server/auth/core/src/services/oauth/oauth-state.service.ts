import { Injectable, Inject } from '@nestjs/common';
import { RedisPort, REDIS_PORT_TOKEN, OAuthProviderName } from '@repo/ports';
import * as crypto from 'crypto';

export interface OAuthStatePayload {
  provider: OAuthProviderName;
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
    const script = `
      local value = redis.call('GET', KEYS[1])
      if not value then
        return nil
      end
      redis.call('DEL', KEYS[1])
      return value
    `;

    const raw = await this.redis.eval<OAuthStatePayload | string | null>(script, [key], []);
    if (!raw) return null;

    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as OAuthStatePayload;
      } catch {
        return null;
      }
    }

    return raw as OAuthStatePayload;
  }
}
