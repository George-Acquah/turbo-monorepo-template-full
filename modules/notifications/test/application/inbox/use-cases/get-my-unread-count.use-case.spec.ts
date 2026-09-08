import { describe, it, expect, beforeEach } from '@jest/globals';
import type { InAppNotificationStorePort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { GetMyUnreadCountUseCase } from '../../../../src/application/inbox/use-cases/get-my-unread-count.use-case';

describe('GetMyUnreadCountUseCase', () => {
  let store: ReturnType<typeof createMock<Pick<InAppNotificationStorePort, 'countForUser'>>>;
  let useCase: GetMyUnreadCountUseCase;

  beforeEach(() => {
    store = createMock<Pick<InAppNotificationStorePort, 'countForUser'>>(['countForUser']);
    useCase = new GetMyUnreadCountUseCase(store as unknown as InAppNotificationStorePort);
  });

  it('counts unread-only notifications for the caller', async () => {
    store.countForUser.mockResolvedValue(3 as never);

    const count = await useCase.execute('usr_1');

    expect(store.countForUser).toHaveBeenCalledWith('usr_1', { unreadOnly: true });
    expect(count).toBe(3);
  });
});
