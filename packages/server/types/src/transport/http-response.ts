export type HttpErrorItem =
  | string
  | {
      field?: string;
      message: string;
      code?: string;
      details?: Record<string, unknown>;
    };

export type HttpResponseMeta = Record<string, unknown>;

export type TransportSerialized<T> =
  T extends bigint
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

type HttpEnvelopeBase = {
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

export interface HttpExceptionBody {
  message?: string | string[] | null;
  error?: string;
  errorCode?: string | null;
  errors?: HttpErrorItem[];
}
