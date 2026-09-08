import { describe, it, expect, beforeEach } from '@jest/globals';
import type {
  CommunicationPreferenceOverrideRepositoryPort,
  NotificationPreferenceRepositoryPort,
} from '@workspace/ports';
import {
  CONFIGURABLE_NOTIFICATION_CHANNELS,
  NOTIFICATION_CATEGORIES,
  NotificationCategory,
} from '@workspace/constants';
import { createMock } from '@workspace/testing/jest';
import { GetMyNotificationPreferencesUseCase } from '../../../../src/application/preferences/use-cases/get-my-notification-preferences.use-case';

const MATRIX_SIZE = NOTIFICATION_CATEGORIES.length * CONFIGURABLE_NOTIFICATION_CHANNELS.length;

describe('GetMyNotificationPreferencesUseCase', () => {
  let preferences: ReturnType<
    typeof createMock<Pick<NotificationPreferenceRepositoryPort, 'listUserPreferences'>>
  >;
  let overrides: ReturnType<
    typeof createMock<Pick<CommunicationPreferenceOverrideRepositoryPort, 'findActiveOverrides'>>
  >;
  let useCase: GetMyNotificationPreferencesUseCase;

  beforeEach(() => {
    preferences = createMock<Pick<NotificationPreferenceRepositoryPort, 'listUserPreferences'>>([
      'listUserPreferences',
    ]);
    overrides = createMock<
      Pick<CommunicationPreferenceOverrideRepositoryPort, 'findActiveOverrides'>
    >(['findActiveOverrides']);
    overrides.findActiveOverrides.mockResolvedValue([] as never);

    useCase = new GetMyNotificationPreferencesUseCase(
      preferences as unknown as NotificationPreferenceRepositoryPort,
      overrides as unknown as CommunicationPreferenceOverrideRepositoryPort,
    );
  });

  it('returns the full matrix enabled by default when the user has no stored rows', async () => {
    preferences.listUserPreferences.mockResolvedValue([] as never);

    const { entries } = await useCase.execute('usr_1');

    // The dispatcher's gate is `if (preference && !preference.enabled) skip` — absent means
    // enabled, so a user who has never opened settings must still see the real (on) state.
    expect(entries).toHaveLength(MATRIX_SIZE);
    expect(entries.every((e) => e.enabled)).toBe(true);
    expect(entries.every((e) => !e.locked)).toBe(true);
  });

  it('overlays a stored disabled row without affecting any other cell', async () => {
    preferences.listUserPreferences.mockResolvedValue([
      {
        id: 'npr_1',
        userId: 'usr_1',
        category: NotificationCategory.BILLING,
        channel: 'SMS',
        enabled: false,
      },
    ] as never);

    const { entries } = await useCase.execute('usr_1');

    const disabled = entries.filter((e) => !e.enabled);
    expect(disabled).toEqual([
      expect.objectContaining({ category: NotificationCategory.BILLING, channel: 'SMS' }),
    ]);
    expect(entries).toHaveLength(MATRIX_SIZE);
  });

  it('marks a category locked when an active override forces delivery, ignoring the stored value', async () => {
    // Stored preference says off; the override says it ships regardless.
    preferences.listUserPreferences.mockResolvedValue([
      {
        id: 'npr_2',
        userId: 'usr_1',
        category: NotificationCategory.IDENTITY,
        channel: 'PUSH',
        enabled: false,
      },
    ] as never);
    overrides.findActiveOverrides.mockImplementation(((category: string) =>
      Promise.resolve(
        category === NotificationCategory.IDENTITY
          ? [{ id: 'cpo_1', category, reason: 'SECURITY', forceDelivery: true }]
          : [],
      )) as never);

    const { entries } = await useCase.execute('usr_1');

    const identity = entries.filter((e) => e.category === NotificationCategory.IDENTITY);
    expect(identity).toHaveLength(CONFIGURABLE_NOTIFICATION_CHANNELS.length);
    // Reported as on and locked — reporting the stored `false` would promise a suppression the
    // dispatcher will not honour.
    expect(identity.every((e) => e.locked && e.enabled && e.lockedReason === 'SECURITY')).toBe(true);

    const others = entries.filter((e) => e.category !== NotificationCategory.IDENTITY);
    expect(others.every((e) => !e.locked && e.lockedReason === null)).toBe(true);
  });

  it('does not lock when an override exists but is not forcing delivery', async () => {
    preferences.listUserPreferences.mockResolvedValue([] as never);
    overrides.findActiveOverrides.mockResolvedValue([
      { id: 'cpo_2', category: NotificationCategory.BILLING, reason: 'LEGAL', forceDelivery: false },
    ] as never);

    const { entries } = await useCase.execute('usr_1');

    expect(entries.every((e) => !e.locked)).toBe(true);
  });

  it('never exposes EMAIL, which dispatch sends without consulting preferences', async () => {
    preferences.listUserPreferences.mockResolvedValue([
      {
        id: 'npr_3',
        userId: 'usr_1',
        category: NotificationCategory.BILLING,
        channel: 'EMAIL',
        enabled: false,
      },
    ] as never);

    const { entries } = await useCase.execute('usr_1');

    expect(entries.some((e) => e.channel === 'EMAIL')).toBe(false);
  });
});
