import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, LocalAuthGuard, RefreshTokenGuard } from '@workspace/guards';
import { Idempotent } from '@workspace/idempotency';
import { RateLimit } from '@workspace/decorators';
import { Cacheable } from '@workspace/cache';
import { DeviceIdService } from '@workspace/auth-core';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { AuthErrorCodes, CacheTTL, RedisKeyPrefixes } from '@workspace/constants';
import { UnauthorizedAppException } from '@workspace/utils';
import { EmailAlreadyVerifiedException } from '@workspace/auth-core';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.use-case';
import { ClaimAccountUseCase } from '../../application/use-cases/claim-account.use-case';
import { RequestEmailVerificationUseCase } from '../../application/use-cases/request-email-verification.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import { TurnstileGuard } from '../guards/turnstile.guard';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ClaimAccountDto } from '../dto/claim-account.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { TokenPairResponse } from '../dto/token-pair.response';
import { UserResponse } from '../dto/user.response';
import { VerifyEmailResponse } from '../dto/verify-email.response';

// Bare @Controller() — no path/version here. Routing is composed centrally by
// apps/api's AppRoutingModule from this module's exported `authRoutes` (see
// auth.routes.ts and modules/CLAUDE.md).
//
// Request metadata (device/ip/user-agent) and the authenticated principal are
// read from ContextPort (populated by the context middleware + auth
// strategies), never from `req` directly.
@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly claimAccountUseCase: ClaimAccountUseCase,
    private readonly requestEmailVerificationUseCase: RequestEmailVerificationUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly deviceIdService: DeviceIdService,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  @Post('register')
  @UseGuards(TurnstileGuard)
  @RateLimit({ limit: 5, windowSeconds: 60, keyPrefix: 'auth' })
  @ApiOperation({ summary: 'Create a new member account and sign in' })
  @ApiResponse({ status: 201, type: TokenPairResponse })
  async register(@Body() dto: RegisterDto): Promise<TokenPairResponse> {
    return this.registerUseCase.execute({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      ...this.sessionMeta(),
    });
  }

  @Post('claim')
  @RateLimit({ limit: 5, windowSeconds: 60, keyPrefix: 'auth' })
  @Idempotent('auth.claim')
  @ApiOperation({ summary: 'Set up an account from a guest-checkout claim token and sign in' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Safe to retry with the same key + body if the request is interrupted.',
  })
  @ApiResponse({ status: 201, type: TokenPairResponse })
  async claim(@Body() dto: ClaimAccountDto): Promise<TokenPairResponse> {
    return this.claimAccountUseCase.execute({
      claimToken: dto.claimToken,
      password: dto.password,
      ...this.sessionMeta(),
    });
  }

  @Post('verify-email')
  @RateLimit({ limit: 10, windowSeconds: 60, keyPrefix: 'auth' })
  @ApiOperation({ summary: 'Verify an email address from a verification token' })
  @ApiResponse({ status: 200, type: VerifyEmailResponse })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<VerifyEmailResponse> {
    return this.verifyEmailUseCase.execute({ rawToken: dto.token });
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-email/resend')
  @RateLimit({ limit: 3, windowSeconds: 300, keyPrefix: 'auth' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend the email verification link' })
  @ApiResponse({ status: 204 })
  async resendVerification(): Promise<void> {
    const user = await this.getCurrentUserUseCase.execute(this.context.getUserId());
    if (user.emailVerified) {
      throw new EmailAlreadyVerifiedException();
    }
    if (!user.email) {
      throw new UnauthorizedAppException(AuthErrorCodes.AUTH_UNAUTHORIZED, 'No email on file');
    }

    await this.requestEmailVerificationUseCase.execute({ userId: user.id, email: user.email });
  }

  @UseGuards(TurnstileGuard, LocalAuthGuard)
  @Post('login')
  @RateLimit({ limit: 10, windowSeconds: 60, keyPrefix: 'auth' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email + password' })
  @ApiResponse({ status: 200, type: TokenPairResponse })
  async login(@Body() _dto: LoginDto): Promise<TokenPairResponse> {
    return this.loginUseCase.execute({
      userId: this.context.getUserId(),
      ...this.sessionMeta(),
    });
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @RateLimit({ limit: 30, windowSeconds: 60, keyPrefix: 'auth' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rotate an access/refresh token pair' })
  @ApiResponse({ status: 200, type: TokenPairResponse })
  async refresh(): Promise<TokenPairResponse> {
    const jti = this.context.getSessionIdOptional();
    if (!jti) throw new UnauthorizedAppException(AuthErrorCodes.AUTH_UNAUTHORIZED, 'Missing session');

    return this.refreshTokenUseCase.execute({
      userId: this.context.getUserId(),
      jti,
      ...this.sessionMeta(),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current session' })
  @ApiResponse({ status: 204 })
  async logout(): Promise<void> {
    const jti = this.context.getSessionIdOptional();
    if (!jti) throw new UnauthorizedAppException(AuthErrorCodes.AUTH_UNAUTHORIZED, 'Missing session');

    await this.logoutUseCase.execute({
      userId: this.context.getUserId(),
      jti,
      tokenExpEpochSeconds: this.context.getAuthMetadata()?.exp,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  // Per-user, low-mutation (no update-user use-case exists in this module
  // yet — if one is added, evict this entry via
  // `@CacheEvict({ prefix: RedisKeyPrefixes.IDENTITY.USER, keyGenerator: ... })`
  // alongside it). Called on effectively every authenticated page load.
  @Cacheable({
    prefix: RedisKeyPrefixes.IDENTITY.USER,
    ttl: CacheTTL.PROFILE,
    keyGenerator: (_args, ctx) => ctx?.userId ?? 'anonymous',
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiResponse({ status: 200, type: UserResponse })
  async me(): Promise<UserResponse> {
    return this.getCurrentUserUseCase.execute(this.context.getUserId()) as Promise<UserResponse>;
  }

  /**
   * Builds session device metadata from ContextPort (never `req`). `deviceId`
   * falls back to a hash of ua:ip when no `x-device-id` header was sent, via
   * DeviceIdService — the session's deviceId column is required.
   */
  private sessionMeta(): {
    deviceId: string;
    ipAddress: string | null;
    userAgent: string | null;
  } {
    const ip = this.context.getIp() ?? null;
    const uaRaw = this.context.getUserAgent();
    const userAgent = uaRaw === 'unknown' ? null : uaRaw;

    const { deviceId } = this.deviceIdService.resolve(undefined, {
      deviceId: this.context.getDeviceId(),
      userAgent: userAgent ?? undefined,
      ip: ip ?? undefined,
    });

    return { deviceId, ipAddress: ip, userAgent };
  }
}
