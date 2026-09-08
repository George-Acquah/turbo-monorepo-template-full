import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { RedisKeyPrefixes } from '@workspace/constants';
import { REDIS_PORT_TOKEN, RedisPort, TokenBlacklistPort } from '@workspace/ports';

@Injectable()
export class TokenBlacklistService implements TokenBlacklistPort {
  constructor(@Inject(REDIS_PORT_TOKEN) private readonly redis: RedisPort) {}

  private key(jti: string): string {
    return `${RedisKeyPrefixes.IDENTITY.TOKEN_BLACKLIST}:${jti}`;
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const value = await this.redis.get(this.key(jti));
    return Boolean(value);
  }

  /**
   * Blacklist a token by its `jti`. TTL should be the token's own remaining
   * lifetime — once it would have expired anyway, the entry is pointless, so
   * Redis is left to evict it.
   */
  async blacklist(jti: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(this.key(jti), '1', Math.max(1, Math.ceil(ttlSeconds)));
  }

  async assertNotBlacklisted(jti: string): Promise<void> {
    if (await this.isBlacklisted(jti)) {
      throw new UnauthorizedException('Token revoked');
    }
  }
}
