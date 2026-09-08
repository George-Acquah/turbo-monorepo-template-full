import { describe, it, expect, beforeEach } from '@jest/globals';
import type { UserPreferenceRepositoryPort } from '@workspace/ports';
import { ThemePreference } from '@workspace/constants';
import { createMock } from '@workspace/testing/jest';
import { GetMyPreferencesUseCase } from '../../../src/application/use-cases/get-my-preferences.use-case';

describe('GetMyPreferencesUseCase', () => {
  let preferences: ReturnType<
    typeof createMock<Pick<UserPreferenceRepositoryPort, 'findByUserId'>>
  >;
  let useCase: GetMyPreferencesUseCase;

  beforeEach(() => {
    preferences = createMock<Pick<UserPreferenceRepositoryPort, 'findByUserId'>>(['findByUserId']);
    useCase = new GetMyPreferencesUseCase(
      preferences as unknown as UserPreferenceRepositoryPort,
    );
  });

  it('returns documented defaults when the user has no preferences row', async () => {
    // Rows are provisioned with the User now, but that isn't retroactive — a user created before
    // that path existed must still get a renderable settings screen, not a null.
    preferences.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('usr_1')).resolves.toEqual({
      theme: ThemePreference.SYSTEM,
      language: 'en',
      timezone: 'UTC',
    });
  });

  it('returns the stored row when one exists', async () => {
    preferences.findByUserId.mockResolvedValue({
      id: 'upf_1',
      userId: 'usr_1',
      theme: ThemePreference.DARK,
      language: 'fr',
      timezone: 'Europe/Paris',
    } as never);

    await expect(useCase.execute('usr_1')).resolves.toEqual({
      theme: ThemePreference.DARK,
      language: 'fr',
      timezone: 'Europe/Paris',
    });
  });

  it('does not leak fields outside the self-service slice', async () => {
    // currency and the notification booleans are intentionally not member-settable — see the
    // MyPreferences doc comment. A stored row carries them; the response must not.
    preferences.findByUserId.mockResolvedValue({
      id: 'upf_1',
      userId: 'usr_1',
      theme: ThemePreference.LIGHT,
      language: 'en',
      timezone: 'UTC',
      currency: 'GHS',
      darkMode: true,
      emailNotifications: false,
      marketingEmails: true,
      preferences: { secret: 1 },
    } as never);

    const result = await useCase.execute('usr_1');

    expect(Object.keys(result).sort()).toEqual(['language', 'theme', 'timezone']);
  });
});
