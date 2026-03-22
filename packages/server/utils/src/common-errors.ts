import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { LoggerPort } from '@repo/ports';
import type { HttpExceptionBody } from '@repo/types';

function buildExceptionBody(
  userMessage: string,
  error: string,
  errorCode?: string,
): HttpExceptionBody {
  return {
    message: userMessage,
    error,
    errorCode: errorCode ?? null,
  };
}

export function handleApiError(
  context: string,
  err: unknown,
  userMessage: string,
  logger: LoggerPort,
  errorCode?: string,
): never {
  logger.error(
    `${context}: ${err instanceof Error ? err.message : String(err)}`,
    err instanceof Error ? err.stack : undefined,
  );

  if (err instanceof ConflictException) {
    throw new ConflictException(buildExceptionBody(userMessage, 'Conflict', errorCode));
  }

  if (err instanceof BadRequestException) {
    throw new BadRequestException(buildExceptionBody(userMessage, 'Bad Request', errorCode));
  }

  if (err instanceof NotFoundException) {
    throw new NotFoundException(buildExceptionBody(userMessage, 'Not Found', errorCode));
  }

  if (err instanceof ForbiddenException) {
    throw new ForbiddenException(buildExceptionBody(userMessage, 'Forbidden', errorCode));
  }

  throw new InternalServerErrorException(
    buildExceptionBody(userMessage, 'Internal Server Error', errorCode),
  );
}

export function handleAppError(
  context: string,
  err: unknown,
  userMessage: string,
  logger: LoggerPort,
) {
  logger.error(
    `${err instanceof Error ? err.message : String(err)}`,
    err instanceof Error ? err.stack : undefined,
    context,
  );

  throw new Error(`${context}: ${userMessage}`);
}
