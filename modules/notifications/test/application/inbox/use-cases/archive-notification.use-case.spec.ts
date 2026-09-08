import { describe, it, expect, beforeEach } from '@jest/globals';
import type { InAppNotificationStorePort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { ArchiveNotificationUseCase } from '../../../../src/application/inbox/use-cases/archive-notification.use-case';
import {
  NotificationAccessDeniedException,
  NotificationNotFoundException,
} from '../../../../src/application/inbox/errors';

describe('ArchiveNotificationUseCase', () => {
  let store: ReturnType<typeof createMock<Pick<InAppNotificationStorePort, 'findById' | 'archive'>>>;
  let useCase: ArchiveNotificationUseCase;

  beforeEach(() => {
    store = createMock<Pick<InAppNotificationStorePort, 'findById' | 'archive'>>([
      'findById',
      'archive',
    ]);
    useCase = new ArchiveNotificationUseCase(store as unknown as InAppNotificationStorePort);
  });

  it('throws NotificationNotFoundException when the row does not exist', async () => {
    store.findById.mockResolvedValue(null as never);

    await expect(useCase.execute('usr_1', 'ian_missing')).rejects.toBeInstanceOf(
      NotificationNotFoundException,
    );
    expect(store.archive).not.toHaveBeenCalled();
  });

  it('throws NotificationAccessDeniedException when the caller does not own the row (IDOR guard)', async () => {
    store.findById.mockResolvedValue({ id: 'ian_1', userId: 'usr_other' } as never);

    await expect(useCase.execute('usr_1', 'ian_1')).rejects.toBeInstanceOf(
      NotificationAccessDeniedException,
    );
    expect(store.archive).not.toHaveBeenCalled();
  });

  it('archives the notification when the caller owns it', async () => {
    store.findById.mockResolvedValue({ id: 'ian_1', userId: 'usr_1' } as never);

    await useCase.execute('usr_1', 'ian_1');

    expect(store.archive).toHaveBeenCalledWith('ian_1');
  });
});
