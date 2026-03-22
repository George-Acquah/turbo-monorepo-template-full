import { resolveStoreDrivers } from '../../../packages/server/persistence/src/store-drivers';

describe('resolveStoreDrivers', () => {
  it('defaults the events store driver to the transaction driver', () => {
    const drivers = resolveStoreDrivers({
      TRANSACTION_DRIVER: 'mongo',
    } as NodeJS.ProcessEnv);

    expect(drivers).toEqual({
      authRepoDriver: 'prisma',
      transactionDriver: 'mongo',
      eventsStoreDriver: 'mongo',
    });
  });

  it('honors an explicit events store override', () => {
    const drivers = resolveStoreDrivers({
      TRANSACTION_DRIVER: 'mongo',
      AUTH_REPO_DRIVER: 'mongo',
      EVENTS_STORE_DRIVER: 'prisma',
    } as NodeJS.ProcessEnv);

    expect(drivers).toEqual({
      authRepoDriver: 'mongo',
      transactionDriver: 'mongo',
      eventsStoreDriver: 'prisma',
    });
  });
});
