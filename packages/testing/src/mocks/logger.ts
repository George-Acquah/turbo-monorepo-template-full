import { jest } from '@jest/globals';
import { createMock } from '../jest/create-mock';

/**
 * Structural logger shape for app and domain tests.
 *
 * Logger behavior is cross-cutting infrastructure, so it is safe to share here
 * as long as this package does not import a concrete application logger port.
 */
export interface LoggerMockShape {
  log(message: unknown, ...optionalParams: unknown[]): void;
  warn(message: unknown, ...optionalParams: unknown[]): void;
  error(message: unknown, ...optionalParams: unknown[]): void;
  debug(message: unknown, ...optionalParams: unknown[]): void;
  verbose(message: unknown, ...optionalParams: unknown[]): void;
}

const LOGGER_METHODS = ['log', 'warn', 'error', 'debug', 'verbose'] as const;

/**
 * Creates a generic logger mock with the standard Nest/workspace logger methods.
 *
 * Domain packages can type it as their logger port with
 * `mockLogger<LoggerPort>()` without making `@workspace/testing` depend on ports.
 */
export function mockLogger<
  TLogger extends LoggerMockShape = LoggerMockShape,
>(): jest.Mocked<TLogger> {
  return createMock<LoggerMockShape>(LOGGER_METHODS) as unknown as jest.Mocked<TLogger>;
}
