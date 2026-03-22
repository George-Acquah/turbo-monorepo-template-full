export type PaymentStatus =
  | 'PENDING'
  | 'INITIATED'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'EXPIRED';
export type PaymentProvider =
  | 'PAYSTACK'
  | 'FLUTTERWAVE'
  | 'MOBILE_MONEY'
  | 'BANK_TRANSFER'
  | 'CASH';
export type PaymentMethod =
  | 'CARD'
  | 'MOBILE_MONEY'
  | 'BANK_TRANSFER'
  | 'USSD'
  | 'QR_CODE'
  | 'CASH';
export type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
export type WebhookEventStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'SKIPPED';

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  method?: PaymentMethod | null;
  providerPaymentId?: string | null;
  providerReference?: string | null;
  authorizationCode?: string | null;
  amount: number;
  currency: string;
  providerFee?: number | null;
  netAmount?: number | null;
  status: PaymentStatus;
  initiatedAt?: Date | null;
  processingAt?: Date | null;
  paidAt?: Date | null;
  failedAt?: Date | null;
  cancelledAt?: Date | null;
  expiredAt?: Date | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  cardLast4?: string | null;
  cardBrand?: string | null;
  cardExpMonth?: number | null;
  cardExpYear?: number | null;
  mobileNetwork?: string | null;
  mobileNumber?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  idempotencyKey?: string | null;
  rawRequest?: Record<string, unknown> | null;
  rawResponse?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput extends Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'> {}

export interface PaymentAttemptRecord {
  id: string;
  paymentId: string;
  attemptNumber: number;
  method?: PaymentMethod | null;
  providerRef?: string | null;
  status: PaymentStatus;
  failureCode?: string | null;
  failureMessage?: string | null;
  rawResponse?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreatePaymentAttemptInput
  extends Omit<PaymentAttemptRecord, 'id' | 'createdAt'> {}

export interface RefundRecord {
  id: string;
  paymentId: string;
  orderId: string;
  providerRefundId?: string | null;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason?: string | null;
  internalNotes?: string | null;
  requestedAt: Date;
  processedAt?: Date | null;
  completedAt?: Date | null;
  failedAt?: Date | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  requestedById?: string | null;
  rawResponse?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRefundInput extends Omit<RefundRecord, 'id' | 'createdAt' | 'updatedAt'> {}

export interface WebhookEventRecord {
  id: string;
  provider: PaymentProvider;
  eventType: string;
  eventId?: string | null;
  payload: Record<string, unknown>;
  headers?: Record<string, unknown> | null;
  signature?: string | null;
  idempotencyKey?: string | null;
  status: WebhookEventStatus;
  processedAt?: Date | null;
  processingError?: string | null;
  retryCount: number;
  lastRetryAt?: Date | null;
  paymentId?: string | null;
  refundId?: string | null;
  orderId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebhookEventInput
  extends Omit<WebhookEventRecord, 'id' | 'createdAt' | 'updatedAt'> {}

export interface SavedPaymentMethodRecord {
  id: string;
  userId: string;
  provider: PaymentProvider;
  providerToken: string;
  type: PaymentMethod;
  displayName: string;
  cardLast4?: string | null;
  cardBrand?: string | null;
  cardExpMonth?: number | null;
  cardExpYear?: number | null;
  mobileNetwork?: string | null;
  mobileNumber?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  isDefault: boolean;
  isActive: boolean;
  expiresAt?: Date | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateSavedPaymentMethodInput
  extends Omit<SavedPaymentMethodRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

export interface PaymentConfigRecord {
  id: string;
  provider: PaymentProvider;
  publicKey?: string | null;
  secretKey?: string | null;
  webhookSecret?: string | null;
  isLive: boolean;
  supportedMethods: PaymentMethod[];
  feePercentage?: number | null;
  feeFixed?: number | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertPaymentConfigInput extends Omit<PaymentConfigRecord, 'id' | 'createdAt' | 'updatedAt'> {}
