import { HttpException, HttpStatus } from '@nestjs/common';
import type { HttpErrorItem, HttpExceptionBody } from '@repo/types';

export interface NormalizedExceptionPayload {
  statusCode: number;
  message: string | null;
  error: string;
  errorCode?: string | null;
  errors?: HttpErrorItem[];
}

function humanizeStatus(statusCode: number): string {
  const enumValue = HttpStatus[statusCode];

  if (typeof enumValue !== 'string') {
    return 'Error';
  }

  return enumValue
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeErrorItems(value: unknown): HttpErrorItem[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  return value.map((item) => {
    if (typeof item === 'string') {
      return item;
    }

    if (item && typeof item === 'object') {
      const entry = item as Record<string, unknown>;

      return {
        field: typeof entry.field === 'string' ? entry.field : undefined,
        message:
          typeof entry.message === 'string' ? entry.message : JSON.stringify(entry),
        code: typeof entry.code === 'string' ? entry.code : undefined,
        details:
          entry.details && typeof entry.details === 'object'
            ? (entry.details as Record<string, unknown>)
            : undefined,
      };
    }

    return String(item);
  });
}

function normalizeHttpExceptionBody(body: unknown): HttpExceptionBody {
  if (typeof body === 'string') {
    return { message: body };
  }

  if (!body || typeof body !== 'object') {
    return {};
  }

  const response = body as Record<string, unknown>;
  const errors =
    normalizeErrorItems(response.errors) ??
    normalizeErrorItems(Array.isArray(response.message) ? response.message : undefined);

  const message = Array.isArray(response.message)
    ? response.message
        .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
        .map((entry) => String(entry))
        .join('; ')
    : response.message != null
      ? String(response.message)
      : null;

  return {
    message,
    error: typeof response.error === 'string' ? response.error : undefined,
    errorCode: typeof response.errorCode === 'string' ? response.errorCode : null,
    errors,
  };
}

export function normalizeException(exception: unknown): NormalizedExceptionPayload {
  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const body = normalizeHttpExceptionBody(exception.getResponse());

    return {
      statusCode,
      message:
        typeof body.message === 'string'
          ? body.message
          : Array.isArray(body.message)
            ? body.message.join('; ')
            : null,
      error: body.error ?? humanizeStatus(statusCode),
      errorCode: body.errorCode ?? null,
      errors: body.errors,
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    error: humanizeStatus(HttpStatus.INTERNAL_SERVER_ERROR),
    errorCode: null,
  };
}
