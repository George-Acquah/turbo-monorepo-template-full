import {
  CONTEXT_TOKEN,
  type ContextPort,
  type CreateWebhookEventInput,
  type DatabaseTx,
  type WebhookEventRecord,
  type WebhookEventStatus,
  PaymentWebhookStorePort,
} from '@repo/ports';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma.service';
import { generateId } from '../../utils/generate-id';
import { resolvePrismaClient } from '../../utils/prisma-client-resolver';
import { toInputJson, toRecord } from '../../utils/prisma-mappers';

@Injectable()
export class PrismaPaymentWebhookStoreAdapter implements PaymentWebhookStorePort {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CONTEXT_TOKEN) private readonly context?: ContextPort,
  ) {}

  async createWebhookEvent(
    data: CreateWebhookEventInput,
    tx?: DatabaseTx,
  ): Promise<WebhookEventRecord> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).webhookEvent.create({
      data: {
        id: generateId('whe'),
        provider: data.provider,
        eventType: data.eventType,
        eventId: data.eventId ?? null,
        payload: data.payload as Prisma.InputJsonValue,
        headers: toInputJson(data.headers),
        signature: data.signature ?? null,
        idempotencyKey: data.idempotencyKey ?? null,
        status: data.status,
        processedAt: data.processedAt ?? null,
        processingError: data.processingError ?? null,
        retryCount: data.retryCount,
        lastRetryAt: data.lastRetryAt ?? null,
        paymentId: data.paymentId ?? null,
        refundId: data.refundId ?? null,
        orderId: data.orderId ?? null,
        ipAddress: data.ipAddress ?? null,
        metadata: toInputJson(data.metadata),
      },
    });

    return this.mapWebhook(row);
  }

  async findByProviderEvent(
    provider: string,
    eventId: string,
  ): Promise<WebhookEventRecord | null> {
    const row = await resolvePrismaClient(this.prisma, this.context).webhookEvent.findFirst({
      where: {
        provider: provider as never,
        eventId,
      },
    });

    return row ? this.mapWebhook(row) : null;
  }

  async updateWebhookStatus(
    id: string,
    status: WebhookEventStatus,
    data?: Partial<WebhookEventRecord>,
    tx?: DatabaseTx,
  ): Promise<WebhookEventRecord> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).webhookEvent.update({
      where: { id },
      data: {
        status,
        processedAt: data?.processedAt,
        processingError: data?.processingError,
        retryCount: data?.retryCount,
        lastRetryAt: data?.lastRetryAt,
        paymentId: data?.paymentId,
        refundId: data?.refundId,
        orderId: data?.orderId,
        ipAddress: data?.ipAddress,
        metadata: data?.metadata === undefined ? undefined : toInputJson(data.metadata ?? null),
      },
    });

    return this.mapWebhook(row);
  }

  private mapWebhook(
    row: Prisma.WebhookEventGetPayload<Record<string, never>>,
  ): WebhookEventRecord {
    return {
      id: row.id,
      provider: row.provider,
      eventType: row.eventType,
      eventId: row.eventId,
      payload: toRecord(row.payload) ?? {},
      headers: toRecord(row.headers) ?? null,
      signature: row.signature,
      idempotencyKey: row.idempotencyKey,
      status: row.status,
      processedAt: row.processedAt,
      processingError: row.processingError,
      retryCount: row.retryCount,
      lastRetryAt: row.lastRetryAt,
      paymentId: row.paymentId,
      refundId: row.refundId,
      orderId: row.orderId,
      ipAddress: row.ipAddress,
      metadata: toRecord(row.metadata) ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
