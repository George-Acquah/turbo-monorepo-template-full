import type { DatabaseTx } from '../shared';
import { PaymentConfigRecord, UpsertPaymentConfigInput } from './payment.types';

export abstract class PaymentConfigStorePort {
  abstract getByProvider(provider: string): Promise<PaymentConfigRecord | null>;
  abstract upsert(data: UpsertPaymentConfigInput, tx?: DatabaseTx): Promise<PaymentConfigRecord>;
  abstract listActive(): Promise<PaymentConfigRecord[]>;
}

export const PAYMENT_CONFIG_STORE_TOKEN = Symbol('PAYMENT_CONFIG_STORE_TOKEN');
