import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common/exceptions';
import { ApiResponse } from '@repo/types';
import { LoggerPort } from '@repo/ports';

export function handleApiError(
  context: string,
  err: unknown,
  userMessage: string,
  logger: LoggerPort,
  errorCode?: string,
) {
  logger.error(
    `${context}: ${err instanceof Error ? err.message : String(err)}`,
    err instanceof Error ? err.stack : undefined,
  );

  if (err instanceof ConflictException) {
    return ApiResponse.conflict(userMessage, { errorCode });
  }

  if (err instanceof BadRequestException) {
    return ApiResponse.badRequest(userMessage, { errorCode });
  }

  if (err instanceof NotFoundException) {
    return ApiResponse.notFound(userMessage, { errorCode });
  }

  if (err instanceof ForbiddenException) {
    return ApiResponse.forbidden(userMessage, { errorCode });
  }

  return ApiResponse.internal(userMessage, { errorCode });
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
