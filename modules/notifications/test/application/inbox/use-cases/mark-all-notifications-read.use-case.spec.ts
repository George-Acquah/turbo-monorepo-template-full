import { describe, it, expect, beforeEach } from '@jest/globals';
import type { InAppNotificationStorePort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { MarkAllNotificationsReadUseCase } from '../../../../src/application/inbox/use-cases/mark-all-notifications-read.use-case';

describe('MarkAllNotificationsReadUseCase', () => {
  let store: ReturnType<typeof createMock<Pick<InAppNotificationStorePort, 'markAllReadForUser'>>>;
  let useCase: MarkAllNotificationsReadUseCase;

  beforeEach(() => {
    store = createMock<Pick<InAppNotificationStorePort, 'markAllReadForUser'>>([
      'markAllReadForUser',
    ]);
    useCase = new MarkAllNotificationsReadUseCase(store as unknown as InAppNotificationStorePort);
  });

  it('marks every unread, userId-keyed notification read and returns the count', async () => {
    store.markAllReadForUser.mockResolvedValue(5 as never);

    const result = await useCase.execute('usr_1');

    expect(store.markAllReadForUser).toHaveBeenCalledWith('usr_1');
    expect(result).toEqual({ count: 5 });
  });
});
