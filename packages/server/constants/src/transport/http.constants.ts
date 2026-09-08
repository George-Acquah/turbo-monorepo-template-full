// Lower-case + hyphenated: matches the HTTP/2 field-name requirement and how
// Node normalizes `req.headers` keys, so the same constant works for both
// `req.header()` (case-insensitive) and direct `req.headers[...]` lookups.
export const HttpHeaders = {
  AUTHORIZATION: 'authorization',
  CONTENT_TYPE: 'content-type',
  REQUESTED_WITH: 'x-requested-with',
  ORIGIN_AUTH: 'x-origin-auth',
  CORRELATION_ID: 'x-correlation-id',
} as const;

export type HttpHeader = (typeof HttpHeaders)[keyof typeof HttpHeaders];
