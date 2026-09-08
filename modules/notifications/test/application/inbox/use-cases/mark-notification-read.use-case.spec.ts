import { describe, it, expect, beforeEach } from '@jest/globals';
import type { InAppNotificationStorePort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { MarkNotificationReadUseCase } from '../../../../src/application/inbox/use-cases/mark-notification-read.use-case';
import {
  NotificationAccessDeniedException,
  NotificationNotFoundException,
} from '../../../../src/application/inbox/errors';

describe('MarkNotificationReadUseCase', () => {
  let store: ReturnType<typeof createMock<Pick<InAppNotificationStorePort, 'findById' | 'markRead'>>>;
  let useCase: MarkNotificationReadUseCase;

  beforeEach(() => {
    store = createMock<Pick<InAppNotificationStorePort, 'findById' | 'markRead'>>([
      'findById',
      'markRead',
    ]);
    useCase = new MarkNotificationReadUseCase(store as unknown as InAppNotificationStorePort);
  });

  it('throws NotificationNotFoundException when the row does not exist', async () => {
    store.findById.mockResolvedValue(null as never);

    await expect(useCase.execute('usr_1', 'ian_missing')).rejects.toBeInstanceOf(
      NotificationNotFoundException,
    );
    expect(store.markRead).not.toHaveBeenCalled();
  });

  it('throws NotificationAccessDeniedException when the caller does not own the row (IDOR guard)', async () => {
    store.findById.mockResolvedValue({ id: 'ian_1', userId: 'usr_other' } as never);

    await expect(useCase.execute('usr_1', 'ian_1')).rejects.toBeInstanceOf(
      NotificationAccessDeniedException,
    );
    expect(store.markRead).not.toHaveBeenCalled();
  });

  it('marks the notification read when the caller owns it via userId', async () => {
    store.findById.mockResolvedValue({ id: 'ian_1', userId: 'usr_1' } as never);

    await useCase.execute('usr_1', 'ian_1');

    expect(store.markRead).toHaveBeenCalledWith('ian_1');
  });

  it('marks the notification read when the caller owns it via profileId', async () => {
    store.findById.mockResolvedValue({ id: 'ian_1', profileId: 'usr_1' } as never);

    await useCase.execute('usr_1', 'ian_1');

    expect(store.markRead).toHaveBeenCalledWith('ian_1');
  });
});
