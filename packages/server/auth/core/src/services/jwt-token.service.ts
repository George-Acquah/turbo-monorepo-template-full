import { Injectable, Inject } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AUTH_RUNTIME_CONFIG_TOKEN, type AuthRuntimeConfig } from '@repo/config';
import { TokenPort } from '@repo/ports';
import { AccessTokenClaims } from '@repo/types';

@Injectable()
export class JwtTokenService implements TokenPort {
  constructor(
    private readonly jwt: JwtService,
    @Inject(AUTH_RUNTIME_CONFIG_TOKEN)
    private readonly cfg: AuthRuntimeConfig,
  ) {}

  async signAccess(claims: AccessTokenClaims): Promise<string> {
    return this.jwt.signAsync(claims, {
      secret: this.cfg.jwt.accessSecret,
      expiresIn: this.cfg.jwt.accessExpiresIn,
    } as JwtSignOptions);
  }

  async signRefresh(claims: AccessTokenClaims & { jti: string }): Promise<string> {
    return this.jwt.signAsync(claims, {
      secret: this.cfg.jwt.refreshSecret,
      expiresIn: this.cfg.jwt.refreshExpiresIn,
      jwtid: claims.jti,
    } as JwtSignOptions);
  }

  async verifyAccess(token: string) {
    return this.jwt.verifyAsync(token, {
      secret: this.cfg.jwt.accessSecret,
    });
  }

  async verifyRefresh(token: string) {
    return this.jwt.verifyAsync(token, {
      secret: this.cfg.jwt.refreshSecret,
    });
  }
}
