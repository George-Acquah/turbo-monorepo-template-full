import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { resolveStoreDrivers } from '@repo/persistence';
import { LOGGER_TOKEN } from '@repo/ports';
import { bootstrap } from '../src/main';
import { WorkersModule } from '../src/workers.module';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    createApplicationContext: jest.fn(),
  },
}));

jest.mock('@repo/persistence', () => ({
  resolveStoreDrivers: jest.fn(),
}));

jest.mock('@repo/ports', () => ({
  LOGGER_TOKEN: 'LOGGER_TOKEN',
}));

jest.mock('../src/workers.module', () => ({
  WorkersModule: class WorkersModule {},
}));

describe('workers bootstrap', () => {
  const logger = {
    log: jest.fn(),
  };

  const config = {
    get: jest.fn().mockReturnValue('test'),
  };

  const app = {
    get: jest.fn((token: unknown) => {
      if (token === LOGGER_TOKEN) return logger;
      if (token === ConfigService) return config;
      return undefined;
    }),
    useLogger: jest.fn(),
    enableShutdownHooks: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (NestFactory.createApplicationContext as jest.Mock).mockResolvedValue(app);
    (resolveStoreDrivers as jest.Mock).mockReturnValue({
      authRepoDriver: 'prisma',
      transactionDriver: 'mongo',
      eventsStoreDriver: 'mongo',
    });
  });

  it('creates the application context and logs the worker runtime details', async () => {
    await bootstrap();

    expect(NestFactory.createApplicationContext).toHaveBeenCalledWith(
      WorkersModule,
      { bufferLogs: true },
    );
    expect(app.useLogger).toHaveBeenCalledWith(logger);
    expect(app.enableShutdownHooks).toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Workers runtime started'),
      'WorkersBootstrap',
    );
  });
});
