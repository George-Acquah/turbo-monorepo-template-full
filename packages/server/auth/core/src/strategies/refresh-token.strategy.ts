import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_RUNTIME_CONFIG_TOKEN, type AuthRuntimeConfig } from '@repo/config';
import { AppRequest, UserContext } from '@repo/types';
import { RedisKeyPrefixes } from '@repo/constants';
import { REDIS_PORT_TOKEN, RedisPort, CONTEXT_TOKEN, ContextPort } from '@repo/ports';

type JwtPayload = {
  sub: string;
  jti?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    @Inject(AUTH_RUNTIME_CONFIG_TOKEN)
    private readonly config: AuthRuntimeConfig,
    @Inject(REDIS_PORT_TOKEN) private readonly redis: RedisPort,
    @Inject(CONTEXT_TOKEN) private readonly contextService: ContextPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.refreshSecret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: AppRequest, payload: JwtPayload): Promise<UserContext> {
    // Extract the raw token string from the request headers
    const rawToken = req.headers.authorization?.replace('Bearer ', '').trim();

    if (!rawToken) {
      // This should ideally never happen due to ExtractJwt.fromAuthHeaderAsBearerToken(),
      // but it's a good safety check.
      throw new UnauthorizedException('Missing token');
    }

    // 1. Redis Check (Quick revocation/replacement check)
    // We store session-scoped refresh token ids in Redis at login/rotation
    // keyed by: auth:refresh:<userId>:<deviceKey>. The token's `jti` (jwt id)
    // is embedded in the signed refresh token so we can quickly validate it.
    const tokenId = payload.jti;

    // Look up any device-scoped token entries for the user
    const keys = await this.redis.keys(`${RedisKeyPrefixes.AUTH.TOKEN_REFRESH}:${payload.sub}:*`);

    if (!keys || keys.length === 0) {
      throw new UnauthorizedException('Refresh token revoked, replaced, or expired');
    }

    // Fetch values and see if any match the token id (preferred) or the raw token (fallback)
    let found = false;
    for (const k of keys) {
      const val = await this.redis.get<string>(k);
      if (!val) continue;

      if (tokenId && val === tokenId) {
        found = true;
        break;
      }

      // Fallback: older deployments may have stored raw token values; compare
      if (val === rawToken) {
        found = true;
        break;
      }
    }

    if (!found) throw new UnauthorizedException('Refresh token revoked, replaced, or expired');

    // Build user context
    const userContext: UserContext = {
      id: payload.sub,
      email: '',
      role: payload.roles?.[0] ?? '',
    };

    // Set user in AsyncLocalStorage context
    this.contextService.setUser(userContext);
    // Set raw refresh token in context for token rotation
    this.contextService.setRawRefreshToken(rawToken);

    return userContext;
  }
}
