export type GatewayPaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING';
export type GatewayRefundStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface InitializeGatewayPaymentInput {
  amount: number;
  currency: string;
  customerEmail?: string;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}

export interface InitializeGatewayPaymentResult {
  authorizationUrl: string;
  providerReference: string;
  accessCode?: string;
}

export interface VerifyGatewayPaymentInput {
  providerReference: string;
}

export interface VerifyGatewayPaymentResult {
  status: GatewayPaymentStatus;
  providerTransactionId?: string;
  paidAt?: Date;
  raw?: unknown;
  feeAmount?: number;
  paymentMethodData?: Record<string, unknown>;
  failureReason?: string;
}

export interface RefundGatewayPaymentInput {
  providerReference: string;
  amount?: number;
  reason?: string;
}

export interface RefundGatewayPaymentResult {
  status: GatewayRefundStatus;
  providerRefundId?: string;
  raw?: unknown;
  failureReason?: string;
}

export interface VerifyWebhookSignatureInput {
  rawBody: string;
  headers: Record<string, string | string[] | undefined>;
  secret: string;
}

export interface ParseWebhookEventInput {
  rawBody: string;
}

export interface ParsedWebhookEvent {
  eventType: string;
  providerEventId?: string;
  data: Record<string, unknown>;
}

export interface PaymentGatewayPort {
  getProviderName(): string;

  initializePayment(input: InitializeGatewayPaymentInput): Promise<InitializeGatewayPaymentResult>;

  verifyPayment(input: VerifyGatewayPaymentInput): Promise<VerifyGatewayPaymentResult>;

  refundPayment(input: RefundGatewayPaymentInput): Promise<RefundGatewayPaymentResult>;

  verifyWebhookSignature(input: VerifyWebhookSignatureInput): boolean;

  parseWebhookEvent(input: ParseWebhookEventInput): ParsedWebhookEvent;
}
