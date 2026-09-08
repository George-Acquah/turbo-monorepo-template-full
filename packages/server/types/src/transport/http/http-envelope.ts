import type { HttpResponseMeta } from './http-meta';
import type { HttpErrorItem } from './http-error';

export type TransportSerialized<T> = T extends bigint
  ? string
  : T extends Date
    ? string
    : T extends readonly (infer U)[]
      ? TransportSerialized<U>[]
      : T extends Map<infer K, infer V>
        ? Array<[TransportSerialized<K>, TransportSerialized<V>]>
        : T extends Set<infer U>
          ? TransportSerialized<U>[]
          : T extends object
            ? {
                [K in keyof T]: TransportSerialized<T[K]>;
              }
            : T;

export type HttpEnvelopeBase = {
  statusCode: number;
  message?: string | null;
  meta?: HttpResponseMeta | null;
  correlationId?: string | null;
  timestamp: string;
};

export interface HttpSuccessEnvelope<T> extends HttpEnvelopeBase {
  success: true;
  data: T;
}

export interface HttpErrorEnvelope extends HttpEnvelopeBase {
  success: false;
  data: null;
  error: string;
  errorCode?: string | null;
  errors?: HttpErrorItem[];
}

export type HttpResponseEnvelope<T> = HttpSuccessEnvelope<T> | HttpErrorEnvelope;

export interface HttpSuccessEnvelopeOptions {
  message?: string | null;
  meta?: HttpResponseMeta | null;
  correlationId?: string | null;
  timestamp?: string;
}

export interface HttpErrorEnvelopeOptions extends HttpSuccessEnvelopeOptions {
  error?: string;
  errorCode?: string | null;
  errors?: HttpErrorItem[];
}
