import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_RUNTIME_CONFIG_TOKEN, type AuthRuntimeConfig } from '@workspace/ports/config';
import { type AppRequest, AccessTokenClaims } from '@workspace/types';
import {
  CONTEXT_TOKEN,
  ContextPort,
  USER_SESSION_REPOSITORY_TOKEN,
  UserSessionRepositoryPort,
} from '@workspace/ports';
import { MissingTokenException, SessionRevokedOrExpiredException } from '../constants/auth.errors';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    @Inject(AUTH_RUNTIME_CONFIG_TOKEN)
    private readonly config: AuthRuntimeConfig,
    @Inject(CONTEXT_TOKEN) private readonly contextService: ContextPort,
    @Inject(USER_SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepo: UserSessionRepositoryPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.refreshSecret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  /**
   * The signature/expiry of the refresh JWT itself is already verified by
   * Passport before this runs. What's left to check is whether this specific
   * session (by jti) is still active — i.e. hasn't been revoked (logout,
   * password reset, security event) — against the real DB-backed session,
   * not a cache that nothing ever populates.
   */
  async validate(req: AppRequest, payload: AccessTokenClaims): Promise<AccessTokenClaims> {
    const rawToken = req.headers.authorization?.replace('Bearer ', '').trim();
    if (!rawToken) {
      throw new MissingTokenException();
    }

    const session = await this.sessionRepo.findByJti(payload.jti);
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new SessionRevokedOrExpiredException();
    }

    // Expose the principal + session id through ContextPort so the controller
    // reads them from context, never `req`. Email isn't carried on the refresh
    // path (never read there) — the use-case re-fetches the user for its
    // current userType/status anyway.
    this.contextService.setUser({ id: session.userId, email: '' });
    this.contextService.setRawRefreshToken(rawToken);
    this.contextService.setSessionId(payload.jti);

    return payload;
  }
}
