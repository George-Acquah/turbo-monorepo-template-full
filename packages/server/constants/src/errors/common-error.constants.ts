export const CommonErrorCodes = {
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  // doc 02 "Idempotency (API side)": an Idempotency-Key reused with a
  // different request body/params than the first call under that key.
  IDEMPOTENCY_KEY_REUSED: 'IDEMPOTENCY_KEY_REUSED',
  // A single user tried to hold open more concurrent SSE streams than
  // SseService permits. Distinct from generic rate limiting: the realtime
  // endpoint is deliberately @SkipRateLimit(), so this is its own cap.
  REALTIME_CONNECTION_LIMIT: 'REALTIME_CONNECTION_LIMIT',
} as const;

export type CommonErrorCode = (typeof CommonErrorCodes)[keyof typeof CommonErrorCodes];
