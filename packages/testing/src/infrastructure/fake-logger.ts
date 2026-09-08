export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: unknown;
  readonly optionalParams: readonly unknown[];
}

export class FakeLogger {
  private readonly entries: LogEntry[] = [];

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.record('debug', message, optionalParams);
  }

  info(message: unknown, ...optionalParams: unknown[]): void {
    this.record('info', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.record('warn', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.record('error', message, optionalParams);
  }

  get all(): readonly LogEntry[] {
    return this.entries;
  }

  byLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter((entry) => entry.level === level);
  }

  clear(): void {
    this.entries.length = 0;
  }

  private record(level: LogLevel, message: unknown, optionalParams: readonly unknown[]): void {
    this.entries.push({ level, message, optionalParams });
  }
}
