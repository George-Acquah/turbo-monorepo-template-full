import { describe, it, expect, beforeEach } from '@jest/globals';
import type { UserPreferenceRepositoryPort } from '@workspace/ports';
import { ThemePreference } from '@workspace/constants';
import { createMock } from '@workspace/testing/jest';
import { UpdateMyPreferencesUseCase } from '../../../src/application/use-cases/update-my-preferences.use-case';

describe('UpdateMyPreferencesUseCase', () => {
  let preferences: ReturnType<
    typeof createMock<Pick<UserPreferenceRepositoryPort, 'upsertByUserId'>>
  >;
  let useCase: UpdateMyPreferencesUseCase;

  beforeEach(() => {
    preferences = createMock<Pick<UserPreferenceRepositoryPort, 'upsertByUserId'>>([
      'upsertByUserId',
    ]);
    preferences.upsertByUserId.mockResolvedValue({
      id: 'upf_1',
      userId: 'usr_1',
      theme: ThemePreference.DARK,
      language: 'en',
      timezone: 'UTC',
    } as never);

    useCase = new UpdateMyPreferencesUseCase(
      preferences as unknown as UserPreferenceRepositoryPort,
    );
  });

  it('writes only the keys supplied', async () => {
    await useCase.execute('usr_1', { theme: ThemePreference.DARK });

    expect(preferences.upsertByUserId).toHaveBeenCalledWith('usr_1', {
      theme: ThemePreference.DARK,
    });
  });

  it('drops undefined keys so an omitted field never overwrites a stored value', async () => {
    // A client sending only `theme` still produces an object with the other keys present-but-
    // undefined once it passes through the DTO; those must not reach the update.
    await useCase.execute('usr_1', {
      theme: ThemePreference.LIGHT,
      language: undefined,
      timezone: undefined,
    });

    expect(preferences.upsertByUserId).toHaveBeenCalledWith('usr_1', {
      theme: ThemePreference.LIGHT,
    });
  });

  it('upserts rather than updates, so a user with no row can still save', async () => {
    await useCase.execute('usr_1', { timezone: 'Europe/London' });

    expect(preferences.upsertByUserId).toHaveBeenCalledTimes(1);
  });

  it('returns only the self-service slice of the persisted row', async () => {
    preferences.upsertByUserId.mockResolvedValue({
      id: 'upf_1',
      userId: 'usr_1',
      theme: ThemePreference.SYSTEM,
      language: 'en',
      timezone: 'UTC',
      currency: 'GHS',
      marketingEmails: true,
    } as never);

    const result = await useCase.execute('usr_1', { theme: ThemePreference.SYSTEM });

    expect(Object.keys(result).sort()).toEqual(['language', 'theme', 'timezone']);
  });
});
