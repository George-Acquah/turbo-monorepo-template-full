import { Global, Module } from '@nestjs/common';
import {
  PAYMENT_CONFIG_STORE_TOKEN,
  PAYMENT_LEDGER_STORE_TOKEN,
  PAYMENT_WEBHOOK_STORE_TOKEN,
  SAVED_PAYMENT_METHOD_STORE_TOKEN,
} from '@repo/ports';
import {
  PrismaPaymentConfigStoreAdapter,
  PrismaPaymentLedgerStoreAdapter,
  PrismaPaymentWebhookStoreAdapter,
  PrismaSavedPaymentMethodStoreAdapter,
} from '../adapters/payments';

@Global()
@Module({
  providers: [
    PrismaPaymentLedgerStoreAdapter,
    PrismaPaymentWebhookStoreAdapter,
    PrismaSavedPaymentMethodStoreAdapter,
    PrismaPaymentConfigStoreAdapter,
    { provide: PAYMENT_LEDGER_STORE_TOKEN, useExisting: PrismaPaymentLedgerStoreAdapter },
    { provide: PAYMENT_WEBHOOK_STORE_TOKEN, useExisting: PrismaPaymentWebhookStoreAdapter },
    { provide: SAVED_PAYMENT_METHOD_STORE_TOKEN, useExisting: PrismaSavedPaymentMethodStoreAdapter },
    { provide: PAYMENT_CONFIG_STORE_TOKEN, useExisting: PrismaPaymentConfigStoreAdapter },
  ],
  exports: [
    PAYMENT_LEDGER_STORE_TOKEN,
    PAYMENT_WEBHOOK_STORE_TOKEN,
    SAVED_PAYMENT_METHOD_STORE_TOKEN,
    PAYMENT_CONFIG_STORE_TOKEN,
  ],
})
export class PrismaPaymentsStoreModule {}
