import type {
  HttpErrorEnvelope,
  HttpErrorEnvelopeOptions,
  HttpSuccessEnvelope,
  HttpSuccessEnvelopeOptions,
  TransportSerialized,
} from '@repo/types';
import { serializeForTransport } from './transport-serialization';

export function createHttpSuccessEnvelope<T>(
  statusCode: number,
  data: T,
  options: HttpSuccessEnvelopeOptions = {},
): HttpSuccessEnvelope<TransportSerialized<T>> {
  return {
    success: true,
    statusCode,
    data: serializeForTransport(data),
    message: options.message ?? null,
    meta: options.meta ?? null,
    correlationId: options.correlationId ?? null,
    timestamp: options.timestamp ?? new Date().toISOString(),
  };
}

export function createHttpErrorEnvelope(
  statusCode: number,
  options: HttpErrorEnvelopeOptions,
): HttpErrorEnvelope {
  return {
    success: false,
    statusCode,
    data: null,
    message: options.message ?? null,
    error: options.error ?? 'Error',
    errorCode: options.errorCode ?? null,
    errors: options.errors,
    meta: options.meta ?? null,
    correlationId: options.correlationId ?? null,
    timestamp: options.timestamp ?? new Date().toISOString(),
  };
}

export function isNoContentStatus(statusCode: number): boolean {
  return statusCode === 204;
}
