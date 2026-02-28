import { registerAs } from '@nestjs/config';

export type StoreDriver = 'prisma' | 'mongo';
export const storeConfigKey = 'storeConfig';

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

export const storeConfig = registerAs(storeConfigKey, () => ({
  authRepoDriver: parseDriver(
    process.env.AUTH_REPO_DRIVER,
    'AUTH_REPO_DRIVER',
    'prisma',
  ),
  transactionDriver: parseDriver(
    process.env.TRANSACTION_DRIVER,
    'TRANSACTION_DRIVER',
    'prisma',
  ),
}));
