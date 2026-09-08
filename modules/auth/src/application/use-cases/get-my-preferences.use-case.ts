import { Inject, Injectable } from '@nestjs/common';
import {
  USER_PREFERENCE_REPOSITORY_TOKEN,
  type UserPreferenceRepositoryPort,
} from '@workspace/ports';
import { DEFAULT_USER_PREFERENCES } from '@workspace/auth-persistence';
import type { MyPreferences } from '../dto/user-preference.dto';

/**
 * A row is normally created alongside the User, but that isn't guaranteed retroactively — users
 * created before that path existed have none. Returning the documented defaults instead of null
 * keeps the settings screen renderable for them, and matches what they'd actually experience
 * (the column defaults are the same values).
 */
@Injectable()
export class GetMyPreferencesUseCase {
  constructor(
    @Inject(USER_PREFERENCE_REPOSITORY_TOKEN)
    private readonly preferences: UserPreferenceRepositoryPort,
  ) {}

  async execute(userId: string): Promise<MyPreferences> {
    const row = await this.preferences.findByUserId(userId);

    return {
      theme: row?.theme ?? DEFAULT_USER_PREFERENCES.theme,
      language: row?.language ?? DEFAULT_USER_PREFERENCES.language,
      timezone: row?.timezone ?? DEFAULT_USER_PREFERENCES.timezone,
      currency: row?.currency ?? DEFAULT_USER_PREFERENCES.currency,
    };
  }
}
