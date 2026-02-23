export interface InitiateForOrderInput {
  orderId: string;
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
}

export interface RequestRefundResult {
  refundId?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  failureReason?: string;
}

export abstract class PaymentsApplicationPort {
  abstract initiateForOrder(input: InitiateForOrderInput): Promise<InitiateForOrderResult>;
  abstract requestRefund(input: RequestRefundInput): Promise<RequestRefundResult>;
}
