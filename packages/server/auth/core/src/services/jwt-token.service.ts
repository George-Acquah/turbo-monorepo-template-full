import { Injectable, Inject } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AUTH_RUNTIME_CONFIG_TOKEN, type AuthRuntimeConfig } from '@workspace/ports/config';
import { MfaTokenClaims, TokenPort } from '@workspace/ports';
import { AccessTokenClaims } from '@workspace/types';

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
      issuer: this.cfg.jwt.issuer,
      audience: this.normalizeAudience(this.cfg.jwt.audience),
      expiresIn: this.cfg.jwt.accessExpiresIn,
    } as JwtSignOptions);
  }

  async signRefresh(claims: AccessTokenClaims & { jti: string }): Promise<string> {
    return this.jwt.signAsync(claims, {
      secret: this.cfg.jwt.refreshSecret,
      issuer: this.cfg.jwt.issuer,
      audience: this.normalizeAudience(this.cfg.jwt.audience),
      expiresIn: this.cfg.jwt.refreshExpiresIn,
    } as JwtSignOptions);
  }

  async signMfa(claims: MfaTokenClaims, ttlMs: number): Promise<string> {
    return await this.jwt.signAsync(claims, {
      secret: this.cfg.jwt.mfaSecret,
      issuer: this.cfg.jwt.issuer,
      audience: this.normalizeAudience(this.cfg.jwt.audience),
      expiresIn: ttlMs,
    } as JwtSignOptions);
  }
  async verifyMfa(token: string): Promise<MfaTokenClaims> {
    return this.jwt.verifyAsync(token, {
      secret: this.cfg.jwt.mfaSecret,
      issuer: this.cfg.jwt.issuer,
      audience: this.normalizeAudience(this.cfg.jwt.audience),
    });
  }

  async verifyAccess(token: string) {
    return this.jwt.verifyAsync(token, {
      secret: this.cfg.jwt.accessSecret,
      issuer: this.cfg.jwt.issuer,
      audience: this.normalizeAudience(this.cfg.jwt.audience),
    });
  }

  async decodeToken(token: string) {
    return this.jwt.decode<AccessTokenClaims>(token);
  }

  async verifyRefresh(token: string) {
    return this.jwt.verifyAsync(token, {
      secret: this.cfg.jwt.refreshSecret,
      issuer: this.cfg.jwt.issuer,
      audience: this.normalizeAudience(this.cfg.jwt.audience),
    });
  }

  private normalizeAudience = (audience: string[]): string | [string, ...string[]] | undefined => {
    if (audience.length === 0) return undefined;
    if (audience.length === 1) return audience[0];
    return [audience[0]!, ...audience.slice(1)];
  };
}
