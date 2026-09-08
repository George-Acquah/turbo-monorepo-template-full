export const AuditErrorCodes = {
  AUDIT_LOG_NOT_FOUND: 'AUDIT_LOG_NOT_FOUND',
  AUDIT_QUERY_INVALID: 'AUDIT_QUERY_INVALID',
  AUDIT_EXPORT_FAILED: 'AUDIT_EXPORT_FAILED',
} as const;

export type AuditErrorCode = (typeof AuditErrorCodes)[keyof typeof AuditErrorCodes];
