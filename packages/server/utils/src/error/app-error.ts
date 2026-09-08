import type { LoggerPort } from '@workspace/ports';
import type { ErrorContext } from './types';

export function handleAppError(ctx: ErrorContext, logger: LoggerPort): never {
  const raw = ctx.error instanceof Error ? ctx.error : new Error(String(ctx.error));

  logger.error(`${ctx.context}: ${raw.message}`, raw.stack);

  throw new Error(`${ctx.context}: ${ctx.message}`);
}
