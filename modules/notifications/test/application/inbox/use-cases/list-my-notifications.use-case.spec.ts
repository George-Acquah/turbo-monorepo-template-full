import { describe, it, expect, beforeEach } from '@jest/globals';
import type { InAppNotificationStorePort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { ListMyNotificationsUseCase } from '../../../../src/application/inbox/use-cases/list-my-notifications.use-case';

describe('ListMyNotificationsUseCase', () => {
  let store: ReturnType<
    typeof createMock<Pick<InAppNotificationStorePort, 'listForUser' | 'countForUser'>>
  >;
  let useCase: ListMyNotificationsUseCase;

  beforeEach(() => {
    store = createMock<Pick<InAppNotificationStorePort, 'listForUser' | 'countForUser'>>([
      'listForUser',
      'countForUser',
    ]);
    useCase = new ListMyNotificationsUseCase(store as unknown as InAppNotificationStorePort);
  });

  it('lists and counts in parallel, mapping skip/take onto offset/limit', async () => {
    store.listForUser.mockResolvedValue([{ id: 'ian_1' }] as never);
    store.countForUser.mockResolvedValue(1 as never);

    const result = await useCase.execute('usr_1', {
      unreadOnly: true,
      archived: false,
      skip: 10,
      take: 20,
    });

    expect(store.listForUser).toHaveBeenCalledWith('usr_1', {
      unreadOnly: true,
      archived: false,
      offset: 10,
      limit: 20,
    });
    expect(store.countForUser).toHaveBeenCalledWith('usr_1', { unreadOnly: true, archived: false });
    expect(result).toEqual({ total: 1, items: [{ id: 'ian_1' }] });
  });

  it('defaults to no filters when called with no options', async () => {
    store.listForUser.mockResolvedValue([] as never);
    store.countForUser.mockResolvedValue(0 as never);

    await useCase.execute('usr_1');

    expect(store.listForUser).toHaveBeenCalledWith('usr_1', {
      unreadOnly: undefined,
      archived: undefined,
      offset: undefined,
      limit: undefined,
    });
  });
});
