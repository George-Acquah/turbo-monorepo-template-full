import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { LoggerPort } from '@workspace/ports';

import type { ErrorContext } from './types';

interface ApiErrorBody {
  message: string;
  error: string;
  errorCode?: string | null;
}

function buildBody(message: string, error: string, errorCode?: string): ApiErrorBody {
  return {
    message,
    error,
    errorCode: errorCode ?? null,
  };
}

export function handleApiError(ctx: ErrorContext, logger: LoggerPort): never {
  const raw = ctx.error instanceof Error ? ctx.error : new Error(String(ctx.error));

  logger.error(`${ctx.context}: ${raw.message}`, raw.stack);

  const body = buildBody(ctx.message, 'Error', ctx.errorCode);

  if (raw instanceof ConflictException) {
    throw new ConflictException(body);
  }

  if (raw instanceof BadRequestException) {
    throw new BadRequestException(body);
  }

  if (raw instanceof NotFoundException) {
    throw new NotFoundException(body);
  }

  if (raw instanceof ForbiddenException) {
    throw new ForbiddenException(body);
  }

  throw new InternalServerErrorException(body);
}
