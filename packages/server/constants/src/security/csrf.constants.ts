export const CSRFHeaders = {
  TOKEN: 'x-csrf-token',
  HEADER: 'X-CSRF-Token',
} as const;

export type CSRFHeader = (typeof CSRFHeaders)[keyof typeof CSRFHeaders];
