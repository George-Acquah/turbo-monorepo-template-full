import { Body, Controller, Get, Inject, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { NOTIFICATION_CATEGORY_LABELS } from '@workspace/constants';
import { NOTIFICATIONS_CONTROLLER_PATHS } from '../../notifications.paths';
import { GetMyNotificationPreferencesUseCase } from '../../application/preferences/use-cases/get-my-notification-preferences.use-case';
import { UpdateMyNotificationPreferenceUseCase } from '../../application/preferences/use-cases/update-my-notification-preference.use-case';
import { UpdateNotificationPreferenceDto } from '../dto/preferences/update-notification-preference.dto';
import { NotificationPreferencesResponse } from '../dto/preferences/notification-preference.response';

// Self-service only — JwtAuthGuard, no PermissionsGuard. A MEMBER JWT carries no identity role,
// so gating this behind an identity permission would lock members out of their own settings
// (same reasoning as modules/profiles' AccountController).
@ApiTags('Notifications — Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(NOTIFICATIONS_CONTROLLER_PATHS.NOTIFICATION_PREFERENCES)
export class NotificationPreferencesController {
  constructor(
    private readonly getMyPreferences: GetMyNotificationPreferencesUseCase,
    private readonly updateMyPreference: UpdateMyNotificationPreferenceUseCase,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get the caller's notification preferences (full matrix)" })
  @ApiResponse({ status: 200, type: NotificationPreferencesResponse })
  async get(): Promise<NotificationPreferencesResponse> {
    const result = await this.getMyPreferences.execute(this.context.getUserId());
    return plainToInstance(
      NotificationPreferencesResponse,
      { entries: result.entries, categoryLabels: NOTIFICATION_CATEGORY_LABELS },
      { excludeExtraneousValues: true },
    );
  }

  @Patch()
  @ApiOperation({ summary: 'Enable or disable one category/channel, and return the new matrix' })
  @ApiResponse({ status: 200, type: NotificationPreferencesResponse })
  async update(@Body() dto: UpdateNotificationPreferenceDto): Promise<NotificationPreferencesResponse> {
    const userId = this.context.getUserId();
    await this.updateMyPreference.execute(userId, dto);
    // Return the recomputed matrix rather than the single row: a locked category ignores the
    // stored value, so echoing the request back could assert a state the dispatcher won't honour.
    const result = await this.getMyPreferences.execute(userId);
    return plainToInstance(
      NotificationPreferencesResponse,
      { entries: result.entries, categoryLabels: NOTIFICATION_CATEGORY_LABELS },
      { excludeExtraneousValues: true },
    );
  }
}
