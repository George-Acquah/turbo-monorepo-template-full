import { jest } from '@jest/globals';

export type AnyFunction = (...args: never[]) => unknown;
export type MockedFunction<T extends AnyFunction> = jest.MockedFunction<T>;

export function mockFn<T extends AnyFunction>(): MockedFunction<T> {
  return jest.fn() as unknown as MockedFunction<T>;
}

export function asMock<T extends AnyFunction>(fn: T): MockedFunction<T> {
  return fn as MockedFunction<T>;
}

export function clearMocks(...mocks: jest.Mock[]): void {
  for (const mock of mocks) {
    mock.mockClear();
  }
}

export function resetMocks(...mocks: jest.Mock[]): void {
  for (const mock of mocks) {
    mock.mockReset();
  }
}

export function restoreMocks(...mocks: jest.Mock[]): void {
  for (const mock of mocks) {
    mock.mockRestore();
  }
}
