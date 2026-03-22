import { NestFactory } from '@nestjs/core';
import {
  APP_RUNTIME_CONFIG_TOKEN,
  PERSISTENCE_RUNTIME_CONFIG_TOKEN,
} from '@repo/config';
import { LOGGER_TOKEN } from '@repo/ports';
import { bootstrap } from '../src/main';
import { WorkersModule } from '../src/workers.module';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    createApplicationContext: jest.fn(),
  },
}));

jest.mock('@repo/config', () => ({
  APP_RUNTIME_CONFIG_TOKEN: 'APP_RUNTIME_CONFIG_TOKEN',
  PERSISTENCE_RUNTIME_CONFIG_TOKEN: 'PERSISTENCE_RUNTIME_CONFIG_TOKEN',
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

  const app = {
    get: jest.fn((token: unknown) => {
      if (token === LOGGER_TOKEN) return logger;
      if (token === APP_RUNTIME_CONFIG_TOKEN) return { nodeEnv: 'test' };
      if (token === PERSISTENCE_RUNTIME_CONFIG_TOKEN) {
        return { eventsStoreDriver: 'mongo' };
      }
      return undefined;
    }),
    useLogger: jest.fn(),
    enableShutdownHooks: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (NestFactory.createApplicationContext as jest.Mock).mockResolvedValue(app);
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
