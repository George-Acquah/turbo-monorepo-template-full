export interface InitiateForOrderInput {
  orderId: string;
  profileId: string;
  email?: string;
  amount: number;
  currency: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface InitiateForOrderResult {
  paymentId: string;
  authorizationUrl?: string;
  providerReference: string;
}

export interface RequestRefundInput {
  paymentId: string;
  amount?: number;
  reason?: string;
  requestedByUserId: string;
  canOverrideWindow?: boolean;
}

export interface RequestRefundResult {
  refundId?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  failureReason?: string;
}

export interface ChargeSavedMethodForRenewalInput {
  profileId: string;
  savedPaymentMethodId: string;
  amountMinor: number;
  currency: string;
  subscriptionId: string;
  pricePlanId: string;
}

export interface ChargeSavedMethodForRenewalResult {
  status: 'SUCCESS' | 'FAILED';
  paymentId: string;
  failureReason?: string;
}

export abstract class PaymentsApplicationPort {
  abstract initiateForOrder(input: InitiateForOrderInput): Promise<InitiateForOrderResult>;
  abstract requestRefund(input: RequestRefundInput): Promise<RequestRefundResult>;
  /**
   * Charges a subscription renewal against a previously-captured saved
   * payment method. The sanctioned seam `modules/memberships`' renewal scan
   * uses to touch money — it may not import `ports/database/schema/billing/**`
   * directly.
   */
  abstract chargeSavedMethodForRenewal(
    input: ChargeSavedMethodForRenewalInput,
  ): Promise<ChargeSavedMethodForRenewalResult>;
}
