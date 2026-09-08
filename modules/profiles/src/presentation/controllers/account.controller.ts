import { Body, Controller, Get, HttpCode, Inject, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { PROFILES_CONTROLLER_PATHS } from '../../profiles.paths';
import { GetMyProfileUseCase } from '../../application/member-profile/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '../../application/member-profile/use-cases/update-my-profile.use-case';
import { CompleteOnboardingUseCase } from '../../application/member-profile/use-cases/complete-onboarding.use-case';
import { UpdateAccountDto } from '../dto/account/update-account.dto';
import { AccountResponse } from '../dto/account/account.response';

// Self-service only — JwtAuthGuard, no PermissionsGuard. A MEMBER JWT has no
// identity role (doc 06 §3: "Members get no identity role"); gating this
// behind an identity permission would lock members out of their own account.
@ApiTags('Profiles — Account')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(PROFILES_CONTROLLER_PATHS.ACCOUNT)
export class AccountController {
  constructor(
    private readonly getMyProfileUseCase: GetMyProfileUseCase,
    private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
    private readonly completeOnboardingUseCase: CompleteOnboardingUseCase,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get the caller's member profile" })
  @ApiResponse({ status: 200, type: AccountResponse })
  async get(): Promise<AccountResponse> {
    const profile = await this.getMyProfileUseCase.execute(this.context.getUserId());
    return plainToInstance(AccountResponse, profile, { excludeExtraneousValues: true });
  }

  @Patch()
  @ApiOperation({ summary: "Update the caller's member profile" })
  @ApiResponse({ status: 200, type: AccountResponse })
  async update(@Body() dto: UpdateAccountDto): Promise<AccountResponse> {
    const updated = await this.updateMyProfileUseCase.execute(this.context.getUserId(), dto);
    return plainToInstance(AccountResponse, updated, { excludeExtraneousValues: true });
  }

  @Post('complete-onboarding')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark the first-run onboarding flow as done (idempotent)' })
  @ApiResponse({ status: 200, type: AccountResponse })
  async completeOnboarding(): Promise<AccountResponse> {
    const updated = await this.completeOnboardingUseCase.execute(this.context.getUserId());
    return plainToInstance(AccountResponse, updated, { excludeExtraneousValues: true });
  }
}
