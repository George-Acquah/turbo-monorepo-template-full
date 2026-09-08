import { Module, Global } from '@nestjs/common';
import { AUTHENTICATOR_PORT_TOKEN, HASH_PORT_TOKEN } from '@workspace/ports';
import {
  Argon2IdHashService,
  // AuthService,
  // JwtTokenService,
  DeviceIdService,
  QrCodeService,
} from './services';
import { OAuthProviderRegistry, OAuthStateService, PkceService } from './services/oauth';
import { AuthenticatorService } from './services/authenticator.service';
// import { EncryptionModule } from '@workspace/encryption';

@Global()
@Module({
  // imports: [EncryptionModule],
  providers: [
    { provide: HASH_PORT_TOKEN, useClass: Argon2IdHashService },
    { provide: AUTHENTICATOR_PORT_TOKEN, useClass: AuthenticatorService },
    QrCodeService,
    // AuthService,
    // JwtTokenService,
    DeviceIdService,
    OAuthProviderRegistry,
    OAuthStateService,
    PkceService,
  ],
  exports: [
    HASH_PORT_TOKEN,
    AUTHENTICATOR_PORT_TOKEN,
    // AuthService,
    DeviceIdService,
    OAuthProviderRegistry,
    OAuthStateService,
    PkceService,
    QrCodeService,
  ],
})
export class AuthCoreInfrastructureModule {}
