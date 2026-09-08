import { jest } from '@jest/globals';

export type MockableMethodKeys<T extends object> = {
  [K in keyof T]-?: T[K] extends (...args: never[]) => unknown ? K : never;
}[keyof T];

export type MockOf<T extends object> = jest.Mocked<T>;

type MutableMockRecord<T extends object> = Partial<Record<keyof T, unknown>>;

/**
 * Creates a typed Jest mock object from an explicit list of method names.
 *
 * Keep package/domain-specific factory functions in the owning package. This
 * utility only knows how to create functions; it intentionally has no domain
 * knowledge and no dependency on application ports.
 */
export function createMock<T extends object>(methods: readonly MockableMethodKeys<T>[]): MockOf<T> {
  const mock: MutableMockRecord<T> = {};

  for (const method of methods) {
    mock[method] = jest.fn();
  }

  return mock as MockOf<T>;
}
