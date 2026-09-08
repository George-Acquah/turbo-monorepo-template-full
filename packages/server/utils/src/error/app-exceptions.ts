import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ErrorCode } from '@workspace/constants';

/**
 * Status-mapped exception base classes that always carry a machine-readable
 * `errorCode`. They extend the matching Nest built-in (so `instanceof
 * UnauthorizedException` etc. still holds) and populate the response body in
 * the shape `normalizeHttpExceptionBody` (@workspace/utils/request) already
 * reads `errorCode` off — no filter/interceptor changes needed to use these.
 *
 * `errorCode` is typed against `ErrorCode` (`@workspace/constants/errors`),
 * the union of every `{Domain}ErrorCodes` map — so a typo or a code that was
 * never registered for any domain fails to compile instead of silently
 * shipping as `null` on the wire.
 */
export class UnauthorizedAppException extends UnauthorizedException {
  constructor(
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super({ message, error: 'Unauthorized', errorCode });
  }
}

export class ForbiddenAppException extends ForbiddenException {
  constructor(
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super({ message, error: 'Forbidden', errorCode });
  }
}

export class NotFoundAppException extends NotFoundException {
  constructor(
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super({ message, error: 'Not Found', errorCode });
  }
}

export class ConflictAppException extends ConflictException {
  constructor(
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super({ message, error: 'Conflict', errorCode });
  }
}

export class BadRequestAppException extends BadRequestException {
  constructor(
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super({ message, error: 'Bad Request', errorCode });
  }
}

export class InternalAppException extends InternalServerErrorException {
  constructor(
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super({ message, error: 'Internal Server Error', errorCode });
  }
}

export class GoneAppException extends GoneException {
  constructor(
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super({ message, error: 'Gone', errorCode });
  }
}

export class BadGatewayAppException extends BadGatewayException {
  constructor(
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super({ message, error: 'Bad Gateway', errorCode });
  }
}
