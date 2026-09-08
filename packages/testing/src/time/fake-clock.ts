import { jest } from '@jest/globals';

export interface FrozenTimeHandle {
  readonly now: Date;
  advanceBy(milliseconds: number): void;
  restore(): void;
}

export function freezeTime(
  now: Date | string = new Date('2026-01-01T00:00:00.000Z'),
): FrozenTimeHandle {
  const frozenDate = typeof now === 'string' ? new Date(now) : now;

  jest.useFakeTimers();
  jest.setSystemTime(frozenDate);

  return {
    now: frozenDate,
    advanceBy(milliseconds: number): void {
      jest.advanceTimersByTime(milliseconds);
    },
    restore(): void {
      jest.useRealTimers();
    },
  };
}

export function restoreTime(): void {
  jest.useRealTimers();
}
