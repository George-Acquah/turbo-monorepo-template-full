import { Module } from '@nestjs/common';
import { AuthPersistenceModule } from '@workspace/auth-persistence';
import { CAPTCHA_VERIFIER_TOKEN } from '@workspace/ports';
import { AuthApplicationPortModule } from './auth-application-port.module';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { IssueAccountClaimTokenUseCase } from './application/use-cases/issue-account-claim-token.use-case';
import { ClaimAccountUseCase } from './application/use-cases/claim-account.use-case';
import { RequestEmailVerificationUseCase } from './application/use-cases/request-email-verification.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { SessionIssuerService } from './application/services/session-issuer.service';
import { TurnstileCaptchaVerifierService } from './infrastructure/captcha/turnstile-captcha-verifier.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { TurnstileGuard } from './presentation/guards/turnstile.guard';

/**
 * Composition root for the auth bounded-context module. Binds this module's
 * own DI subtree to the concrete auth persistence adapters (AuthPersistenceModule
 * is not @Global(), so every consumer needs this import — same pattern as
 * @workspace/auth-core's own AuthCoreModule).
 *
 * DeviceIdService, TOKEN_PORT_TOKEN, HASH_PORT_TOKEN, TOKEN_BLACKLIST_PORT_TOKEN
 * and CONTEXT_TOKEN come from the already-global AuthCoreModule/AppContextModule.
 */
@Module({
  imports: [AuthPersistenceModule, AuthApplicationPortModule],
  controllers: [AuthController],
  providers: [
    SessionIssuerService,
    LoginUseCase,
    RegisterUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    GetCurrentUserUseCase,
    IssueAccountClaimTokenUseCase,
    ClaimAccountUseCase,
    RequestEmailVerificationUseCase,
    VerifyEmailUseCase,
    TurnstileCaptchaVerifierService,
    { provide: CAPTCHA_VERIFIER_TOKEN, useExisting: TurnstileCaptchaVerifierService },
    TurnstileGuard,
  ],
})
export class AuthModule {}
