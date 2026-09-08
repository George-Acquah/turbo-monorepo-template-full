export type GatewayPaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING';
export type GatewayRefundStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface InitializeGatewayPaymentInput {
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  reference: string;
  // callbackUrl?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}

export interface InitializeGatewayPaymentResult {
  authorizationUrl: string;
  providerReference: string;
  providerPaymentId?: string;
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
  /**
   * The gateway-confirmed amount/currency, when the provider's verify
   * response includes them — the actual authority for "never trust the
   * popup, re-verify with the gateway" amount checks. Optional: not every
   * provider payload surfaces both (e.g. Hubtel has no currency field, being
   * GHS-only). Absent means "no contradicting evidence," not "mismatch" —
   * callers should only fail closed when a value is present and differs.
   */
  amountMinor?: number;
  currency?: string;
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

export interface ChargeAuthorizationInput {
  /** The gateway's reusable-charge token (Paystack: `authorization_code`). */
  authorizationToken: string;
  amount: number;
  currency: string;
  /** Not always resolvable at the renewal-scan call site; adapters fall back
   * to a placeholder the same way `initializePayment` already does. */
  customerEmail?: string;
  /** Our own payment reference — idempotency key at the gateway. */
  reference: string;
}

export interface ChargeAuthorizationResult {
  status: GatewayPaymentStatus;
  providerTransactionId?: string;
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
  /**
   * Our own payment reference (the `reference`/`providerReference` passed at
   * `initializePayment` time), extracted independently of `providerEventId`.
   * `providerEventId` can, for some event shapes, fall back to this same
   * value when a provider payload lacks its own event id — without this
   * separate field, a later distinct event for the same payment could
   * collide on the `(provider, providerEventId)` dedup constraint.
   */
  paymentReference?: string;
  data: Record<string, unknown>;
}

export interface PaymentGatewayPort {
  getProviderName(): string;

  initializePayment(input: InitializeGatewayPaymentInput): Promise<InitializeGatewayPaymentResult>;

  verifyPayment(input: VerifyGatewayPaymentInput): Promise<VerifyGatewayPaymentResult>;

  refundPayment(input: RefundGatewayPaymentInput): Promise<RefundGatewayPaymentResult>;

  /**
   * Charges a previously-captured reusable payment method (subscription
   * renewal). Not every provider supports this — an adapter that doesn't
   * returns `{status: 'FAILED', failureReason: 'not supported'}` rather than
   * fabricating an unverified integration.
   */
  chargeAuthorization(input: ChargeAuthorizationInput): Promise<ChargeAuthorizationResult>;

  verifyWebhookSignature(input: VerifyWebhookSignatureInput): boolean;

  parseWebhookEvent(input: ParseWebhookEventInput): ParsedWebhookEvent;
}
