export interface ErrorContext {
  context: string;
  message: string;
  error?: unknown;
  errorCode?: string;
}
