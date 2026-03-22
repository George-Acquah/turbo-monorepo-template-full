import type { HttpErrorItem } from './http-response';

export type WebSocketMeta = Record<string, unknown>;

export interface WebSocketErrorPayload {
  success: false;
  message?: string | null;
  error: string;
  errorCode?: string | null;
  errors?: HttpErrorItem[];
  correlationId?: string | null;
  timestamp: string;
  meta?: WebSocketMeta | null;
}

export interface WebSocketErrorPayloadOptions {
  message?: string | null;
  error?: string;
  errorCode?: string | null;
  errors?: HttpErrorItem[];
  correlationId?: string | null;
  timestamp?: string;
  meta?: WebSocketMeta | null;
}
