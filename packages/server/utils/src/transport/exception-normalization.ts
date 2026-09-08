import { HttpException, HttpStatus } from '@nestjs/common';
import type { HttpErrorItem, HttpExceptionBody } from '@workspace/types';

// Importing from your domain-oriented string module
import {
  titleCase,
  toSnakeCase,
  stripHtml,
  truncate,
  isEmpty,
  redact,
} from '../string';

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

  // Replaces manual lowercasing, splitting, mapping, and joining
  return titleCase(enumValue.replace(/_/g, ' '));
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
        field: typeof entry.field === 'string' && !isEmpty(entry.field) ? entry.field : undefined,
        message: typeof entry.message === 'string' ? entry.message : JSON.stringify(entry),
        // Standardize codes like "invalid_input" to "INVALID_INPUT"
        code: typeof entry.code === 'string' ? toSnakeCase(entry.code).toUpperCase() : undefined,
        // Crucial security addition: Automatically redact sensitive data in validation details
        details:
          entry.details && typeof entry.details === 'object'
            ? (redact(entry.details) as Record<string, unknown>)
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
    // Standardize the top-level error code
    errorCode:
      typeof response.errorCode === 'string' ? toSnakeCase(response.errorCode).toUpperCase() : null,
    errors,
  };
}

// 1. Define sensitive keywords that indicate an infrastructure leak
const SENSITIVE_KEYWORDS = [
  'outbox',
  'database',
  'sql',
  'redis',
  'typeorm',
  'prisma',
  'connection',
];

function isSensitiveMessage(msg: string): boolean {
  const lowerMsg = msg.toLowerCase();
  return SENSITIVE_KEYWORDS.some((keyword) => lowerMsg.includes(keyword));
}

export function normalizeException(exception: unknown): NormalizedExceptionPayload {
  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const body = normalizeHttpExceptionBody(exception.getResponse());

    let message =
      typeof body.message === 'string'
        ? body.message
        : Array.isArray(body.message)
          ? body.message.join('; ')
          : null;

    // Use string utils to sanitize the error payload
    if (message && !isEmpty(message)) {
      message = stripHtml(message); // Prevent XSS from upstream error responses
      message = truncate(message, 1000); // Prevent gigantic payloads from overwhelming logging or UI
    } else {
      message = null;
    }

    // 2. Intercept and mask infrastructure leaks masquerading as HttpExceptions
    if (message && isSensitiveMessage(message)) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected system error occurred during the operation.',
        error: humanizeStatus(HttpStatus.INTERNAL_SERVER_ERROR),
        errorCode: 'INTERNAL_SYSTEM_ERROR',
      };
    }

    return {
      statusCode,
      message,
      error: body.error ?? humanizeStatus(statusCode),
      errorCode: body.errorCode ?? null,
      errors: body.errors,
    };
  }

  // Handle true unknown errors safely
  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    error: humanizeStatus(HttpStatus.INTERNAL_SERVER_ERROR),
    errorCode: null,
  };
}
