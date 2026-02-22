// ─────────────────────────────────────────────────────────────────────────────
// PROJECT AUDIT ENUMS (extended "include everything that must be included")
// Pattern should matches your database schema: grouped entities/actions for dot-notation + flat arrays.
// ─────────────────────────────────────────────────────────────────────────────

import { toMap } from './to-map';

// ─────────────────────────────────────────────────────────────────────────────
// ACTION GROUPS
// ─────────────────────────────────────────────────────────────────────────────

// Data lifecycle and record handling
export const DATA_LIFECYCLE_ACTIONS = toMap([
  'CREATE',
  'UPDATE',
  'DELETE',
  'SOFT_DELETE',
  'RESTORE',
  'ARCHIVE',
  'UNARCHIVE',
  'MERGE',
  'DUPLICATE',
  'BULK_CREATE',
  'BULK_UPDATE',
  'BULK_DELETE',
  'IMPORT',
  'EXPORT',
  'ATTACH',
  'DETACH',
  'USE_EXISTING',
] as const);

// Authentication & access
export const AUTH_ACCESS_ACTIONS = toMap([
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET_REQUEST',
  'PASSWORD_RESET',
  'MFA_ENABLED',
  'MFA_DISABLED',
  'MFA_CHALLENGE_FAILED',
  'SESSION_EXPIRED',
  'TOKEN_REFRESH',
  'OAUTH_LINKED',
  'OAUTH_UNLINKED',
  'API_KEY_CREATED',
  'API_KEY_REVOKED',
] as const);

// Security & permissions / account control
export const SECURITY_ACTIONS = toMap([
  'ASSIGN_ROLE',
  'REVOKE_ROLE',
  'GRANT_PERMISSION',
  'REVOKE_PERMISSION',
  'SUSPEND',
  'ACTIVATE',
  'LOCK',
  'UNLOCK',
  'IMPERSONATE_START',
  'IMPERSONATE_END',
  'ACCESS_DENIED',
] as const);

// Payments & finance events
export const PAYMENT_ACTIONS = toMap([
  'AUTHORIZE',
  'CAPTURE',
  'VOID',
  'PAYMENT_FAILED',
  'PAYMENT_RETRY',
  'REFUND_CREATE',
  'REFUND_UPDATE',
  'CHARGEBACK_OPEN',
  'CHARGEBACK_WON',
  'CHARGEBACK_LOST',
  'PAYOUT_CREATED',
  'PAYOUT_PAID',
  'RECONCILE',
] as const);

// Communication / notifications / support
export const COMMUNICATION_ACTIONS = toMap([
  'NOTIFY',
  'EMAIL_SENT',
  'SMS_SENT',
  'PUSH_SENT',
  'TICKET_OPEN',
  'TICKET_REPLY',
  'TICKET_CLOSE',
] as const);

// Integrations / webhooks / jobs
export const INTEGRATION_ACTIONS = toMap([
  'WEBHOOK_REGISTER',
  'WEBHOOK_UPDATE',
  'WEBHOOK_DELETE',
  'WEBHOOK_DELIVERED',
  'WEBHOOK_FAILED',
  'SYNC_START',
  'SYNC_SUCCESS',
  'SYNC_FAILED',
  'JOB_RUN',
  'JOB_RETRY',
  'JOB_CANCEL',
] as const);

// System & configuration changes
export const SYSTEM_ACTIONS = toMap([
  'CONFIG_CHANGE',
  'FEATURE_FLAG_ENABLE',
  'FEATURE_FLAG_DISABLE',
  'MAINTENANCE_MODE_ON',
  'MAINTENANCE_MODE_OFF',
] as const);

export const AUDIT_ACTION_TYPES = [
  ...Object.values(DATA_LIFECYCLE_ACTIONS),
  ...Object.values(AUTH_ACCESS_ACTIONS),
  ...Object.values(SECURITY_ACTIONS),
  ...Object.values(PAYMENT_ACTIONS),
  ...Object.values(COMMUNICATION_ACTIONS),
  ...Object.values(INTEGRATION_ACTIONS),
  ...Object.values(SYSTEM_ACTIONS),
] as const;

export type AuditActionType = (typeof AUDIT_ACTION_TYPES)[number];
