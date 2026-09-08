import type { OffsetPaginationMeta, CursorPaginationMeta } from './pagination';

/**
 * Mirrors `HttpResponseMeta` (packages/server/types/src/transport/http/http-meta.ts):
 * an open bag of metadata, with `pagination` populated by
 * `HttpResponseEnvelopeInterceptor` whenever a controller returns
 * `PaginationResult<T>` (`{ items, meta }`).
 */
export interface ApiResponseMeta {
  pagination?: OffsetPaginationMeta | CursorPaginationMeta;
  [key: string]: unknown;
}

export type ApiErrorItem =
  | string
  | {
      field?: string;
      message: string;
      code?: string;
      details?: Record<string, unknown>;
    };

/** Mirrors `HttpSuccessEnvelope<T>` (packages/server/utils/src/http/envelope.ts). */
export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  message?: string | null;
  meta?: ApiResponseMeta | null;
  correlationId?: string | null;
  timestamp: string;
}

/** Mirrors `HttpErrorEnvelope` (packages/server/utils/src/http/envelope.ts). */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  data: null;
  message?: string | null;
  error: string;
  errorCode?: string | null;
  errors?: ApiErrorItem[];
  meta?: ApiResponseMeta | null;
  correlationId?: string | null;
  timestamp: string;
}

/** Envelope every `HttpResponseEnvelopeInterceptor`-wrapped response is shaped as. */
export type ApiResponseType<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
