import { Body, Controller, Get, Inject, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { AUTH_CONTROLLER_PATHS } from '../../auth.paths';
import { GetMyPreferencesUseCase } from '../../application/use-cases/get-my-preferences.use-case';
import { UpdateMyPreferencesUseCase } from '../../application/use-cases/update-my-preferences.use-case';
import { UpdatePreferencesDto } from '../dto/preferences/update-preferences.dto';
import { PreferencesResponse } from '../dto/preferences/preferences.response';

// Self-service only — JwtAuthGuard, no PermissionsGuard. A MEMBER JWT carries no identity role,
// so gating this behind a permission would lock members out of their own settings.
//
// Declares its own path rather than inheriting AuthModule's 'auth' prefix: these are the
// caller's app preferences, not an authentication operation, and /v1/auth/preferences would
// misrepresent that. Mounted at '/' by authRoutes — see UserPreferencesModule.
@ApiTags('Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(AUTH_CONTROLLER_PATHS.PREFERENCES)
export class PreferencesController {
  constructor(
    private readonly getMyPreferences: GetMyPreferencesUseCase,
    private readonly updateMyPreferences: UpdateMyPreferencesUseCase,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get the caller's app preferences" })
  @ApiResponse({ status: 200, type: PreferencesResponse })
  async get(): Promise<PreferencesResponse> {
    const preferences = await this.getMyPreferences.execute(this.context.getUserId());
    return plainToInstance(PreferencesResponse, preferences, { excludeExtraneousValues: true });
  }

  @Patch()
  @ApiOperation({ summary: "Update the caller's app preferences (partial)" })
  @ApiResponse({ status: 200, type: PreferencesResponse })
  async update(@Body() dto: UpdatePreferencesDto): Promise<PreferencesResponse> {
    const updated = await this.updateMyPreferences.execute(this.context.getUserId(), dto);
    return plainToInstance(PreferencesResponse, updated, { excludeExtraneousValues: true });
  }
}
