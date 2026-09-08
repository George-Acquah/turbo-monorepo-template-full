import { Inject, Injectable } from '@nestjs/common';
import {
  USER_PREFERENCE_REPOSITORY_TOKEN,
  type UserPreferenceRepositoryPort,
} from '@workspace/ports';
import type { MyPreferences, UpdateMyPreferencesInput } from '../dto/user-preference.dto';

/**
 * Partial update — only the keys present are written, so changing the theme doesn't silently
 * reset a member's timezone. Upserts rather than updates because the row may not exist (see
 * GetMyPreferencesUseCase); a settings save must not 404 for a user created before rows were
 * provisioned on registration.
 */
@Injectable()
export class UpdateMyPreferencesUseCase {
  constructor(
    @Inject(USER_PREFERENCE_REPOSITORY_TOKEN)
    private readonly preferences: UserPreferenceRepositoryPort,
  ) {}

  async execute(userId: string, input: UpdateMyPreferencesInput): Promise<MyPreferences> {
    // Strip undefined so an absent key never overwrites a stored value with null.
    const patch = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );

    const row = await this.preferences.upsertByUserId(userId, patch);

    return { theme: row.theme, language: row.language, timezone: row.timezone, currency: row.currency };
  }
}
