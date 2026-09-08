import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AUTH_RUNTIME_CONFIG_TOKEN, type AuthRuntimeConfig } from '@workspace/ports/config';
import { type AccessTokenClaims, type ContextAuthData, type UserContext } from '@workspace/types';
import {
  CONTEXT_TOKEN,
  ContextPort,
  TOKEN_BLACKLIST_PORT_TOKEN,
  TokenBlacklistPort,
  USER_REPOSITORY_TOKEN,
  UserRepositoryPort,
} from '@workspace/ports';
import { UserNotFoundOrInactiveException } from '../constants/auth.errors';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(AUTH_RUNTIME_CONFIG_TOKEN)
    cfg: AuthRuntimeConfig,
    @Inject(CONTEXT_TOKEN) private readonly contextService: ContextPort,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepo: UserRepositoryPort,
    @Inject(TOKEN_BLACKLIST_PORT_TOKEN)
    private readonly tokenBlacklist: TokenBlacklistPort,
  ) {
    super({
      // Accept the JWT from either:
      //   1. Authorization: Bearer <token>  — used by server-side authAwareFetch
      //      and any API clients / mobile apps
      //   2. app_access_token cookie — used by the browser's native
      //      EventSource (withCredentials: true), which cannot send custom headers
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.['app_access_token'] ?? null,
      ]),
      secretOrKey: cfg.jwt.accessSecret,
      ignoreExpiration: false,
      passReqToCallback: false,
    });
  }

  async validate(
    payload: AccessTokenClaims & { iat?: number; exp?: number },
  ): Promise<UserContext> {
    // Immediate revocation: a logged-out (or otherwise revoked) access token
    // is rejected before its natural expiry.
    if (payload.jti) {
      await this.tokenBlacklist.assertNotBlacklisted(payload.jti);
    }

    const user = await this.userRepo.findById(payload.sub, {
      select: ['id', 'email', 'status', 'deletedAt'],
    });

    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new UserNotFoundOrInactiveException();
    }

    const userContext: UserContext = {
      id: user.id,
      email: user.email ?? '',
    };

    this.contextService.setUser(userContext);

    if (payload.jti) {
      this.contextService.setSessionId(payload.jti);
    }

    if (typeof payload.iat === 'number' && typeof payload.exp === 'number') {
      const authMetadata: ContextAuthData = {
        iat: payload.iat,
        exp: payload.exp,
        tokenType: 'access',
      };
      this.contextService.setAuthMetadata(authMetadata);
    }

    return userContext;
  }
}
