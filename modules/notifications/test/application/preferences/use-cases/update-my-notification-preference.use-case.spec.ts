import { describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import type { NotificationPreferenceRepositoryPort } from '@workspace/ports';
import { NotificationCategory } from '@workspace/constants';
import { createMock } from '@workspace/testing/jest';
import { UpdateMyNotificationPreferenceUseCase } from '../../../../src/application/preferences/use-cases/update-my-notification-preference.use-case';

describe('UpdateMyNotificationPreferenceUseCase', () => {
  let preferences: ReturnType<
    typeof createMock<Pick<NotificationPreferenceRepositoryPort, 'upsert'>>
  >;
  let useCase: UpdateMyNotificationPreferenceUseCase;

  beforeEach(() => {
    preferences = createMock<Pick<NotificationPreferenceRepositoryPort, 'upsert'>>(['upsert']);
    preferences.upsert.mockResolvedValue({ id: 'npr_1' } as never);

    useCase = new UpdateMyNotificationPreferenceUseCase(
      preferences as unknown as NotificationPreferenceRepositoryPort,
    );
  });

  it('upserts the preference for a valid category/channel', async () => {
    await useCase.execute('usr_1', {
      category: NotificationCategory.EVENTS,
      channel: 'SMS',
      enabled: false,
    });

    expect(preferences.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'usr_1',
        category: NotificationCategory.EVENTS,
        channel: 'SMS',
        enabled: false,
      }),
    );
  });

  it('upserts rather than creates, so repeat writes to the same triple do not conflict', async () => {
    const input = {
      category: NotificationCategory.EVENTS,
      channel: 'PUSH' as const,
      enabled: false,
    };

    await useCase.execute('usr_1', input);
    await useCase.execute('usr_1', { ...input, enabled: true });

    // The unique key is (userId, channel, category); create() twice would violate it.
    expect(preferences.upsert).toHaveBeenCalledTimes(2);
  });

  it('rejects EMAIL — dispatch ignores preferences for it, so storing one would be a dead setting', async () => {
    await expect(
      useCase.execute('usr_1', {
        category: NotificationCategory.BILLING,
        channel: 'EMAIL',
        enabled: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(preferences.upsert).not.toHaveBeenCalled();
  });

  it('rejects a channel outside the configurable set', async () => {
    await expect(
      useCase.execute('usr_1', {
        category: NotificationCategory.BILLING,
        channel: 'CARRIER_PIGEON',
        enabled: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(preferences.upsert).not.toHaveBeenCalled();
  });

  it('rejects a category outside the catalogue', async () => {
    // `category` is an unconstrained String column — without this check a typo would persist a
    // row no handler ever reads.
    await expect(
      useCase.execute('usr_1', { category: 'billling', channel: 'SMS', enabled: true }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(preferences.upsert).not.toHaveBeenCalled();
  });
});
