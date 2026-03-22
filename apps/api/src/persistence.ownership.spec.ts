import { validateServerEnv } from '@repo/config';

describe('persistence ownership', () => {
  it('pins canonical auth, transaction, and event state to Prisma', () => {
    const env = validateServerEnv(
      {
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/turbo_dev_pg',
        JWT_ACCESS_TOKEN_SECRET: 'access-secret',
        JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
      } as NodeJS.ProcessEnv,
      'api',
    );

    expect(env.persistence).toEqual({
      authRepoDriver: 'prisma',
      transactionDriver: 'prisma',
      eventsStoreDriver: 'prisma',
    });
  });

  it('provides a grouped storage config with local defaults', () => {
    const env = validateServerEnv(
      {
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/turbo_dev_pg',
        JWT_ACCESS_TOKEN_SECRET: 'access-secret',
        JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
      } as NodeJS.ProcessEnv,
      'api',
    );

    expect(env.storage).toEqual({
      provider: 'local',
      defaultBucket: 'uploads',
      publicBaseUrl: undefined,
      local: {
        rootPath: '.data/storage',
      },
      s3: {
        endpoint: undefined,
        region: 'auto',
        accessKeyId: undefined,
        secretAccessKey: undefined,
        bucket: undefined,
        forcePathStyle: false,
      },
    });
  });
});
