import type { DatabaseTx } from '../shared';
import {
  CreateSavedPaymentMethodInput,
  SavedPaymentMethodRecord,
} from './payment.types';

export abstract class SavedPaymentMethodStorePort {
  abstract create(data: CreateSavedPaymentMethodInput, tx?: DatabaseTx): Promise<SavedPaymentMethodRecord>;
  abstract listByUser(userId: string): Promise<SavedPaymentMethodRecord[]>;
  abstract setDefault(id: string, userId: string, tx?: DatabaseTx): Promise<void>;
  abstract deactivate(id: string, tx?: DatabaseTx): Promise<void>;
}

export const SAVED_PAYMENT_METHOD_STORE_TOKEN = Symbol('SAVED_PAYMENT_METHOD_STORE_TOKEN');
