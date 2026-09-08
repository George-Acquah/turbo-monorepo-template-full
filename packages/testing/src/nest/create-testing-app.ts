import type { INestApplication, ModuleMetadata } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { createTestingModule } from './create-testing-module';

export interface TestingAppOptions {
  configure?: (app: INestApplication, moduleRef: TestingModule) => void | Promise<void>;
}

export async function createTestingApp(
  metadata: ModuleMetadata,
  options: TestingAppOptions = {},
): Promise<INestApplication> {
  const moduleRef = await createTestingModule(metadata);
  const app = moduleRef.createNestApplication();

  await options.configure?.(app, moduleRef);
  await app.init();

  return app;
}
