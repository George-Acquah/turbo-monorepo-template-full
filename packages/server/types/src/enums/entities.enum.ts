// ─────────────────────────────────────────────────────────────────────────────
// ENTITY GROUPS
// ─────────────────────────────────────────────────────────────────────────────

import { toMap } from './to-map';

// Identity + Access (customers, admins, auth, RBAC)
export const IDENTITY_ACCESS_ENTITIES = toMap([
  'USER', // admin/staff/customer depending on your model
  'CUSTOMER',
  'STAFF_USER',
  'SESSION',
  'ROLE',
  'PERMISSION',
  'API_KEY',
  'MFA_DEVICE',
  'OAUTH_CONNECTION',
] as const);

// Payments / Billing / Invoicing
export const PAYMENT_ENTITIES = toMap([
  'PAYMENT',
  'PAYMENT_ATTEMPT',
  'PAYMENT_METHOD',
  'PAYMENT_INTENT',
  'PAYMENT_TRANSACTION',
  'REFUND',
  'CHARGEBACK',
  'INVOICE',
  'RECEIPT',
  'PAYOUT',
] as const);

// Integrations / Webhooks / External systems
export const INTEGRATION_ENTITIES = toMap([
  'INTEGRATION',
  'WEBHOOK',
  'WEBHOOK_EVENT',
  'SYNC_JOB',
  'IMPORT_JOB',
  'EXPORT_JOB',
  'MARKETPLACE_LISTING',
  'MARKETPLACE_ORDER_LINK',
] as const);

// Risk / Security / Compliance
export const RISK_COMPLIANCE_ENTITIES = toMap([
  'FRAUD_CASE',
  'RISK_RULE',
  'KYC_VERIFICATION',
  'CONSENT_RECORD',
  'DATA_EXPORT_REQUEST',
  'DATA_DELETION_REQUEST',
  'AUDIT_LOG',
] as const);

// System / Operations
export const SYSTEM_ENTITIES = toMap([
  'SYSTEM',
  'FEATURE_FLAG',
  'CONFIG',
  'JOB',
  'SCHEDULED_TASK',
  'ERROR_EVENT',
  'RATE_LIMIT_EVENT',
] as const);

// ─────────────────────────────────────────────────────────────────────────────
// FLAT ARRAYS (class-validator friendly) + DERIVED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export const AUDIT_ENTITY_TYPES = [
  ...Object.values(IDENTITY_ACCESS_ENTITIES),
  ...Object.values(PAYMENT_ENTITIES),
  ...Object.values(INTEGRATION_ENTITIES),
  ...Object.values(RISK_COMPLIANCE_ENTITIES),
  ...Object.values(SYSTEM_ENTITIES),
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];
