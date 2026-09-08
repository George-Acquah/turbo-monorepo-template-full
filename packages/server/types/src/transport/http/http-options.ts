import { HttpErrorItem } from './http-error';

export interface HttpSuccessEnvelopeOptions {
  message?: string | null;
  meta?: Record<string, unknown> | null;
  correlationId?: string | null;
  timestamp?: string;
}

export interface HttpErrorEnvelopeOptions extends HttpSuccessEnvelopeOptions {
  error?: string;
  errorCode?: string | null;
  errors?: HttpErrorItem[];
}
