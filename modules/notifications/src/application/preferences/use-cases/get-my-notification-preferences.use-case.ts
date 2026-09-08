import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN,
  type NotificationPreferenceRepositoryPort,
  COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN,
  type CommunicationPreferenceOverrideRepositoryPort,
} from '@workspace/ports';
import {
  CONFIGURABLE_NOTIFICATION_CHANNELS,
  NOTIFICATION_CATEGORIES,
  type ConfigurableNotificationChannel,
  type NotificationCategory,
} from '@workspace/constants';
import type {
  MyNotificationPreferences,
  NotificationPreferenceEntry,
} from '../dto/notification-preference.dto';

/**
 * Returns the complete category × channel matrix, not just the rows that happen to exist.
 *
 * `NotificationPreference` rows are sparse and the dispatcher's gate is
 * `if (preference && !preference.enabled) skip` — so a missing row means **enabled**, and a user
 * who has never opened settings has no rows at all. Returning `listUserPreferences` verbatim
 * would render an empty settings screen for exactly the users who most need to see the defaults.
 * So: build the full matrix enabled-by-default, then overlay whatever is stored.
 */
@Injectable()
export class GetMyNotificationPreferencesUseCase {
  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN)
    private readonly preferences: NotificationPreferenceRepositoryPort,
    @Inject(COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN)
    private readonly overrides: CommunicationPreferenceOverrideRepositoryPort,
  ) {}

  async execute(userId: string): Promise<MyNotificationPreferences> {
    const stored = await this.preferences.listUserPreferences(userId);

    // Keyed lookup so the matrix build below stays O(categories × channels).
    const storedByKey = new Map(stored.map((row) => [`${row.category}:${row.channel}`, row]));

    // One lookup per category rather than per cell — findActiveOverrides is category-scoped and
    // the result applies to every channel in that category.
    const lockReasons = new Map<string, string | null>(
      await Promise.all(
        NOTIFICATION_CATEGORIES.map(async (category): Promise<[string, string | null]> => {
          const active = await this.overrides.findActiveOverrides(category);
          const forcing = active.find((o) => o.forceDelivery);
          return [category, forcing ? forcing.reason : null];
        }),
      ),
    );

    const entries: NotificationPreferenceEntry[] = [];
    for (const category of NOTIFICATION_CATEGORIES) {
      const lockedReason = lockReasons.get(category) ?? null;
      for (const channel of CONFIGURABLE_NOTIFICATION_CHANNELS) {
        const row = storedByKey.get(`${category}:${channel}`);
        entries.push({
          category: category as NotificationCategory,
          channel: channel as ConfigurableNotificationChannel,
          // A locked category is delivered regardless of the stored value, so report it as on.
          enabled: lockedReason !== null ? true : (row?.enabled ?? true),
          locked: lockedReason !== null,
          lockedReason,
        });
      }
    }

    return { entries };
  }
}
