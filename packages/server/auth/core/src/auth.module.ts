import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_RUNTIME_CONFIG_TOKEN, type AuthRuntimeConfig } from '@repo/config';

import { TOKEN_PORT_TOKEN, HASH_PORT_TOKEN } from '@repo/ports';
import {
  JwtTokenService,
  BcryptHashService,
  AuthService,
  OAuthProviderRegistry,
  OAuthStateService,
  PkceService,
} from './services';
import { DeviceIdService } from './services/device-id.service';
import { EmailPasswordStrategy, JwtAccessStrategy, RefreshTokenStrategy } from './strategies';

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [AUTH_RUNTIME_CONFIG_TOKEN],
      useFactory: (cfg: AuthRuntimeConfig) => ({
        secret: cfg.jwt.accessSecret,
        signOptions: { expiresIn: cfg.jwt.accessExpiresIn as never },
      }),
    }),
  ],
  providers: [
    { provide: TOKEN_PORT_TOKEN, useClass: JwtTokenService },
    { provide: HASH_PORT_TOKEN, useClass: BcryptHashService },

    AuthService,
    DeviceIdService,
    OAuthProviderRegistry,
    OAuthStateService,
    PkceService,

    JwtAccessStrategy,
    RefreshTokenStrategy,
    EmailPasswordStrategy,
  ],
  exports: [AuthService, OAuthProviderRegistry, OAuthStateService, PkceService],
})
export class AuthCoreModule {}
