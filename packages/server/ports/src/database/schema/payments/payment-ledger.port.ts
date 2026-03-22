import type { DatabaseTx } from '../shared';
import {
  CreatePaymentAttemptInput,
  CreatePaymentInput,
  CreateRefundInput,
  PaymentAttemptRecord,
  PaymentRecord,
  RefundRecord,
} from './payment.types';

export abstract class PaymentLedgerStorePort {
  abstract createPayment(data: CreatePaymentInput, tx?: DatabaseTx): Promise<PaymentRecord>;
  abstract findPaymentById(id: string): Promise<PaymentRecord | null>;
  abstract findPaymentsByOrderId(orderId: string): Promise<PaymentRecord[]>;
  abstract updatePaymentStatus(
    id: string,
    data: Partial<PaymentRecord> & Pick<PaymentRecord, 'status'>,
    tx?: DatabaseTx,
  ): Promise<PaymentRecord>;
  abstract recordAttempt(data: CreatePaymentAttemptInput, tx?: DatabaseTx): Promise<PaymentAttemptRecord>;
  abstract createRefund(data: CreateRefundInput, tx?: DatabaseTx): Promise<RefundRecord>;
  abstract listRefundsForPayment(paymentId: string): Promise<RefundRecord[]>;
}

export const PAYMENT_LEDGER_STORE_TOKEN = Symbol('PAYMENT_LEDGER_STORE_TOKEN');
