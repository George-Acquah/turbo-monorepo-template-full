import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthPersistenceModule } from '@workspace/auth-persistence';
import { AUTH_RUNTIME_CONFIG_TOKEN, type AuthRuntimeConfig } from '@workspace/ports/config';

import { TOKEN_BLACKLIST_PORT_TOKEN, TOKEN_PORT_TOKEN } from '@workspace/ports';
import {
  JwtTokenService,
  OAuthProviderRegistry,
  OAuthStateService,
  PkceService,
  TokenBlacklistService,
} from './services';
import { DeviceIdService } from './services/device-id.service';
import { EmailPasswordStrategy, JwtAccessStrategy, RefreshTokenStrategy } from './strategies';
import { AuthCoreInfrastructureModule } from './core-infrastructure.module';

@Global()
@Module({
  imports: [
    AuthCoreInfrastructureModule,
    // JwtAccessStrategy/RefreshTokenStrategy/EmailPasswordStrategy all need
    // USER_REPOSITORY_TOKEN/USER_SESSION_REPOSITORY_TOKEN — @workspace/auth-core
    // is specifically the auth bounded-context's package, so depending on
    // its own persistence adapter directly is the correct direction, not a
    // layering violation.
    AuthPersistenceModule,
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
    JwtTokenService,
    { provide: TOKEN_PORT_TOKEN, useExisting: JwtTokenService },

    DeviceIdService,
    OAuthProviderRegistry,
    OAuthStateService,
    PkceService,
    TokenBlacklistService,
    { provide: TOKEN_BLACKLIST_PORT_TOKEN, useExisting: TokenBlacklistService },

    JwtAccessStrategy,
    RefreshTokenStrategy,
    EmailPasswordStrategy,
  ],
  exports: [
    JwtTokenService,
    OAuthProviderRegistry,
    OAuthStateService,
    PkceService,
    TokenBlacklistService,
    TOKEN_BLACKLIST_PORT_TOKEN,
    TOKEN_PORT_TOKEN,
  ],
})
export class AuthCoreModule {}
