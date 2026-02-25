import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthConfig } from './configs/auth.config';

import { TOKEN_PORT_TOKEN, HASH_PORT_TOKEN } from '@repo/ports';
import { JwtTokenService, BcryptHashService, AuthService } from './services';
import { DeviceIdService } from './services/device-id.service';
import { JwtAccessStrategy } from './strategies';

@Global()
@Module({
  imports: [PassportModule, JwtModule.register({}), ConfigModule.forFeature(AuthConfig)],
  providers: [
    { provide: TOKEN_PORT_TOKEN, useClass: JwtTokenService },
    { provide: HASH_PORT_TOKEN, useClass: BcryptHashService },

    AuthService,
    DeviceIdService,

    JwtAccessStrategy,
    // JwtRefreshStrategy,
  ],
  exports: [AuthService],
})
export class AuthCoreModule {}
