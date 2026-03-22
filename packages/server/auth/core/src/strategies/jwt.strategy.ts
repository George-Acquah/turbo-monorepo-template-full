import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Inject } from '@nestjs/common';
import { AUTH_RUNTIME_CONFIG_TOKEN, type AuthRuntimeConfig } from '@repo/config';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(AUTH_RUNTIME_CONFIG_TOKEN)
    cfg: AuthRuntimeConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.jwt.accessSecret,
      ignoreExpiration: false,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async validate(payload: any) {
    return payload;
  }
}
