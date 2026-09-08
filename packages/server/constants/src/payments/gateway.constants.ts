// Matches billing.prisma Payment.provider / SavedPaymentMethod.provider checks
// exactly. STRIPE is legacy/stale (CLAUDE.md: not extended); MOMO was replaced
// by the three real Ghana mobile-money rails.
export const GatewayProvider = {
  PAYSTACK: 'PAYSTACK',
  FLUTTERWAVE: 'FLUTTERWAVE',
  HUBTEL: 'HUBTEL',
  MTN_MOMO: 'MTN_MOMO',
  VODAFONE_CASH: 'VODAFONE_CASH',
  AIRTEL_TIGO: 'AIRTEL_TIGO',
  MANUAL: 'MANUAL',
  OTHER: 'OTHER',
} as const;

export type GatewayProvider = (typeof GatewayProvider)[keyof typeof GatewayProvider];

// Matches billing.prisma Payment.method / SavedPaymentMethod.method checks exactly.
export const GatewayPaymentMethod = {
  CARD: 'CARD',
  MOBILE_MONEY: 'MOBILE_MONEY',
  BANK_TRANSFER: 'BANK_TRANSFER',
  USSD: 'USSD',
  QR: 'QR',
  CASH: 'CASH',
  OTHER: 'OTHER',
} as const;

export type GatewayPaymentMethod = (typeof GatewayPaymentMethod)[keyof typeof GatewayPaymentMethod];

export const GatewayPaymentStatus = {
  PENDING: 'PENDING',
  INITIATED: 'INITIATED',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  EXPIRED: 'EXPIRED',
} as const;

export type GatewayPaymentStatus = (typeof GatewayPaymentStatus)[keyof typeof GatewayPaymentStatus];

// Matches billing.prisma Refund.status exactly — includes the human
// REQUESTED/APPROVED/REJECTED approval states (refund:approve is a status
// transition, not a workflow-engine task; see billing.prisma model comment).
export const RefundStatus = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
} as const;

export type RefundStatus = (typeof RefundStatus)[keyof typeof RefundStatus];

// Matches billing.prisma WebhookEvent.status exactly.
export const WebhookEventStatus = {
  RECEIVED: 'RECEIVED',
  PROCESSING: 'PROCESSING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
  IGNORED: 'IGNORED',
  RETRY: 'RETRY',
} as const;

export type WebhookEventStatus = (typeof WebhookEventStatus)[keyof typeof WebhookEventStatus];

export const PaymentAttemptStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  TIMEOUT: 'TIMEOUT',
} as const;

export type PaymentAttemptStatus = (typeof PaymentAttemptStatus)[keyof typeof PaymentAttemptStatus];

export const PaymentPurpose = {
  FEE: 'FEE',
  SUBSCRIPTION: 'SUBSCRIPTION',
  ADHOC: 'ADHOC',
} as const;

export type PaymentPurpose = (typeof PaymentPurpose)[keyof typeof PaymentPurpose];
