import { getValidatedServerEnv, type StoreDriver } from '@repo/config';

export type { StoreDriver } from '@repo/config';

export interface StoreDrivers {
  authRepoDriver: StoreDriver;
  transactionDriver: StoreDriver;
  eventsStoreDriver: StoreDriver;
}

function parseDriver(
  value: string | undefined,
  envName: string,
  fallback: StoreDriver,
): StoreDriver {
  if (!value) return fallback;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'prisma' || normalized === 'mongo') {
    return normalized;
  }

  throw new Error(
    `${envName} must be either "prisma" or "mongo". Received: ${value}`,
  );
}

export function resolveStoreDrivers(env?: NodeJS.ProcessEnv): StoreDrivers {
  if (!env) {
    const validatedEnv = getValidatedServerEnv();
    return {
      authRepoDriver: validatedEnv.persistence.authRepoDriver,
      transactionDriver: validatedEnv.persistence.transactionDriver,
      eventsStoreDriver: validatedEnv.persistence.eventsStoreDriver,
    };
  }

  const transactionDriver = parseDriver(
    env.TRANSACTION_DRIVER,
    'TRANSACTION_DRIVER',
    'prisma',
  );

  return {
    authRepoDriver: parseDriver(
      env.AUTH_REPO_DRIVER,
      'AUTH_REPO_DRIVER',
      'prisma',
    ),
    transactionDriver,
    eventsStoreDriver: parseDriver(
      env.EVENTS_STORE_DRIVER,
      'EVENTS_STORE_DRIVER',
      transactionDriver,
    ),
  };
}
