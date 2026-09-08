export type HttpErrorItem =
  | string
  | {
      field?: string;
      message: string;
      code?: string;
      details?: Record<string, unknown>;
    };

export interface HttpExceptionBody {
  message?: string | string[] | null;
  error?: string;
  errorCode?: string | null;
  errors?: HttpErrorItem[];
}
