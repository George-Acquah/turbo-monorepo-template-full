import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN,
  type NotificationPreferenceRepositoryPort,
} from '@workspace/ports';
import {
  CONFIGURABLE_NOTIFICATION_CHANNELS,
  NOTIFICATION_CATEGORIES,
  NotificationErrorCodes,
  type ConfigurableNotificationChannel,
  type NotificationCategory,
} from '@workspace/constants';
import { BadRequestAppException } from '@workspace/utils';
import type { UpdateNotificationPreferenceInput } from '../dto/notification-preference.dto';

/**
 * Upserts one cell of the matrix.
 *
 * Validation is here rather than only in the DTO because the rules are domain facts, not request
 * shape: EMAIL is rejected because the dispatcher never consults preferences for it (storing one
 * would be a setting that silently does nothing), and categories are constrained to the catalogue
 * because `NotificationPreference.category` is an unconstrained `String` in the schema — without
 * this check, a typo would persist a row that no handler ever reads.
 *
 * Upsert, not create: the row may or may not exist (absent = enabled), and the unique key is
 * `(userId, channel, category)`.
 */
@Injectable()
export class UpdateMyNotificationPreferenceUseCase {
  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN)
    private readonly preferences: NotificationPreferenceRepositoryPort,
  ) {}

  async execute(userId: string, input: UpdateNotificationPreferenceInput): Promise<void> {
    const category = this.assertCategory(input.category);
    const channel = this.assertChannel(input.channel);

    await this.preferences.upsert({
      userId,
      category,
      channel,
      enabled: input.enabled,
      // Quiet hours are a separate concern with their own (unbuilt) surface; upsert requires the
      // full create shape, so carry the schema defaults rather than inventing values here.
      quietHoursEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
    });
  }

  private assertCategory(value: string): NotificationCategory {
    if (!(NOTIFICATION_CATEGORIES as readonly string[]).includes(value)) {
      throw new BadRequestAppException(
        NotificationErrorCodes.NOTIFICATION_CATEGORY_UNKNOWN,
        `Unknown notification category: ${value}`,
      );
    }
    return value as NotificationCategory;
  }

  private assertChannel(value: string): ConfigurableNotificationChannel {
    if (!(CONFIGURABLE_NOTIFICATION_CHANNELS as readonly string[]).includes(value)) {
      throw new BadRequestAppException(
        NotificationErrorCodes.NOTIFICATION_CHANNEL_NOT_CONFIGURABLE,
        `Notification channel is not configurable: ${value}`,
      );
    }
    return value as ConfigurableNotificationChannel;
  }
}
