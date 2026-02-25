import { Injectable, Inject } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { type ConfigType } from '@nestjs/config';
import { AuthConfig } from '../configs/auth.config';
import { TokenPort } from '@repo/ports';
import { AccessTokenClaims } from '@repo/types';

@Injectable()
export class JwtTokenService implements TokenPort {
  constructor(
    private readonly jwt: JwtService,
    @Inject(AuthConfig.KEY)
    private readonly cfg: ConfigType<typeof AuthConfig>,
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
