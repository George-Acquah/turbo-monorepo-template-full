import { HttpStatus } from '@nestjs/common';

/**
 * Standardized error item shape (friendly for validation + API clients).
 */
export type ApiErrorItem =
  | string
  | {
      field?: string;
      message: string;
      code?: string;
      details?: Record<string, unknown>;
    };

export type ApiMeta = Record<string, unknown>;

type BaseOpts = {
  correlationId?: string | null;
  timestamp?: string; // ISO
  meta?: ApiMeta | null;
};

type ErrorOpts = BaseOpts & {
  errorCode?: string | null;
  errors?: ApiErrorItem[];
};

export type ApiSuccessResponse<T> = {
  success: true;
  statusCode: number;
  data: T;
  message?: string | null;
  meta?: ApiMeta | null;
  correlationId?: string | null;
  timestamp: string;
};

export type ApiErrorResponse = {
  success: false;
  statusCode: number;
  data: null;
  message?: string | null;
  error: string;
  errorCode?: string | null;
  errors?: ApiErrorItem[];
  meta?: ApiMeta | null;
  correlationId?: string | null;
  timestamp: string;
};

export type ApiResponseShape<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * (Optional properties from both Success and Error shapes)
 */
export interface IApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T | null;
  message?: string | null;
  error?: string;
  errorCode?: string | null;
  errors?: ApiErrorItem[];
  meta?: ApiMeta | null;
  correlationId?: string | null;
  timestamp: string;
}

/**
 * Factory-style response with curated constructors.
 * Note: this is a *data container*, not a Nest "response" class.
 */
export class ApiResponse<T> implements IApiResponse<T> {
  public success!: ApiResponseShape<T>['success'];
  public statusCode!: number;
  public data!: T;
  public message?: string | null;
  public error?: string; // only when success=false
  public errorCode?: string | null;
  public errors?: ApiErrorItem[];
  public meta?: ApiMeta | null;
  public correlationId?: string | null;
  public timestamp!: string;

  private constructor(payload: ApiResponseShape<T>) {
    // We cast to any or the base interface here because
    // we know the payload matches the class structure
    Object.assign(this, payload);
  }

  /**
   * The one true constructor for consistency.
   */
  static create<T>(
    statusCode: number,
    data: T,
    opts?: BaseOpts & {
      message?: string | null;
      error?: string | null; // if set => error response (data forced null)
      errorCode?: string | null;
      errors?: ApiErrorItem[];
      bigInt?: 'string' | 'number'; // choose your policy
    },
  ): ApiResponse<T> {
    const timestamp = opts?.timestamp ?? new Date().toISOString();
    const correlationId = opts?.correlationId ?? null;
    const meta = opts?.meta ?? null;

    const bigIntPolicy = opts?.bigInt ?? 'string';
    const safeData = this.sanitizeBigInt(data, bigIntPolicy) as T;

    const isError = Boolean(opts?.error);

    if (isError) {
      const payload: ApiErrorResponse = {
        success: false,
        statusCode,
        data: null,
        message: opts?.message ?? null,
        error: opts!.error ?? 'Error',
        errorCode: opts?.errorCode ?? null,
        errors: opts?.errors,
        meta,
        correlationId,
        timestamp,
      };
      return new ApiResponse<T>(payload);
    }

    const payload: ApiSuccessResponse<T> = {
      success: true,
      statusCode,
      data: safeData,
      message: opts?.message ?? null,
      meta,
      correlationId,
      timestamp,
    };
    return new ApiResponse<T>(payload);
  }

  // ---------- ergonomic factories ----------

  static ok<T>(data: T, message = 'Operation successful', opts?: BaseOpts) {
    return this.create<T>(HttpStatus.OK, data, { ...opts, message });
  }

  static created<T>(data: T, message = 'Resource created successfully', opts?: BaseOpts) {
    return this.create<T>(HttpStatus.CREATED, data, { ...opts, message });
  }

  static noContent(message = 'Request processed; no content returned', opts?: BaseOpts) {
    return this.create<null>(HttpStatus.NO_CONTENT, null, { ...opts, message });
  }

  static badRequest(
    message = 'The request is invalid or malformed',
    opts?: ErrorOpts & { error?: string },
  ) {
    return this.create<null>(HttpStatus.BAD_REQUEST, null, {
      ...opts,
      message,
      error: opts?.error ?? 'Invalid Request',
    });
  }

  static unauthorized(
    message = 'Authentication is required to access this resource',
    opts?: ErrorOpts & { error?: string },
  ) {
    return this.create<null>(HttpStatus.UNAUTHORIZED, null, {
      ...opts,
      message,
      error: opts?.error ?? 'Unauthorized',
    });
  }

  static forbidden(
    message = 'You do not have permission to perform this action',
    opts?: ErrorOpts & { error?: string },
  ) {
    return this.create<null>(HttpStatus.FORBIDDEN, null, {
      ...opts,
      message,
      error: opts?.error ?? 'Access Denied',
    });
  }

  static conflict(
    message = 'The request conflicts with the current state of the server',
    opts?: ErrorOpts & { error?: string },
  ) {
    return this.create<null>(HttpStatus.CONFLICT, null, {
      ...opts,
      message,
      error: opts?.error ?? 'Resource Conflict',
    });
  }

  static internal(
    message = 'An unexpected error occurred on our end',
    opts?: ErrorOpts & { error?: string },
  ) {
    return this.create<null>(HttpStatus.INTERNAL_SERVER_ERROR, null, {
      ...opts,
      message,
      error: opts?.error ?? 'Internal Server Error',
    });
  }

  static paginated<T, M extends Record<string, unknown> | null | undefined>(
    items: T[],
    meta: M,
    message = 'Records retrieved successfully',
    opts?: Omit<BaseOpts, 'meta'>,
  ) {
    return this.create<T[]>(HttpStatus.OK, items, {
      ...opts,
      message,
      meta: meta ?? null,
    });
  }

  // ---------- BigInt sanitization without losing Dates etc ----------

  private static sanitizeBigInt(value: unknown, policy: 'string' | 'number'): unknown {
    if (typeof value === 'bigint') return policy === 'number' ? Number(value) : value.toString();

    if (value instanceof Date) return value; // keep dates intact

    if (Array.isArray(value)) return value.map((v) => this.sanitizeBigInt(v, policy));

    if (value && typeof value === 'object') {
      // preserve plain objects; avoid touching class instances too hard
      const proto = Object.getPrototypeOf(value);
      const isPlain = proto === Object.prototype || proto === null;
      if (!isPlain) return value;

      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = this.sanitizeBigInt(v, policy);
      }
      return out;
    }

    return value;
  }
}
