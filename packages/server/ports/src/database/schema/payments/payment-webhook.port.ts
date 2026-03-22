import type { DatabaseTx } from '../shared';
import { CreateWebhookEventInput, WebhookEventRecord, WebhookEventStatus } from './payment.types';

export abstract class PaymentWebhookStorePort {
  abstract createWebhookEvent(data: CreateWebhookEventInput, tx?: DatabaseTx): Promise<WebhookEventRecord>;
  abstract findByProviderEvent(
    provider: string,
    eventId: string,
  ): Promise<WebhookEventRecord | null>;
  abstract updateWebhookStatus(
    id: string,
    status: WebhookEventStatus,
    data?: Partial<WebhookEventRecord>,
    tx?: DatabaseTx,
  ): Promise<WebhookEventRecord>;
}

export const PAYMENT_WEBHOOK_STORE_TOKEN = Symbol('PAYMENT_WEBHOOK_STORE_TOKEN');
