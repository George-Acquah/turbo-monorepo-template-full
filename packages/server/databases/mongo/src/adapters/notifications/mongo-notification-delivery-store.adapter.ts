import {
  type CreateNotificationInput,
  type NotificationDeliveryAttempt,
  NotificationDeliveryStorePort,
  type NotificationRecord,
} from '@repo/ports';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  type NotificationDocument,
  NotificationModelName,
} from '../../schemas/notifications/notification.schema';
import { generateDocumentId } from '../../utils/document-id';

@Injectable()
export class MongoNotificationDeliveryStoreAdapter implements NotificationDeliveryStorePort {
  constructor(
    @InjectModel(NotificationModelName)
    private readonly model: Model<NotificationDocument>,
  ) {}

  async create(data: CreateNotificationInput): Promise<NotificationRecord> {
    const created = await this.model.create({
      id: generateDocumentId('ntf'),
      ...data,
      status: data.status ?? 'PENDING',
      retryCount: data.retryCount ?? 0,
      maxRetries: data.maxRetries ?? 3,
      attempts: [],
    });

    return this.map(created.toObject());
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    const row = await this.model.findOne({ id }).lean().exec();
    return row ? this.map(row) : null;
  }

  async findPending(limit: number): Promise<NotificationRecord[]> {
    const now = new Date();
    const rows = await this.model
      .find({
        status: { $in: ['PENDING', 'FAILED'] },
        $and: [
          { $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }] },
          { $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: now } }] },
        ],
      })
      .sort({ scheduledAt: 1, createdAt: 1 })
      .limit(limit)
      .lean()
      .exec();

    return rows.map((row) => this.map(row));
  }

  async markQueued(id: string, queuedAt?: Date): Promise<NotificationRecord> {
    const row = await this.model
      .findOneAndUpdate(
        { id },
        {
          $set: {
            status: 'QUEUED',
            queuedAt: queuedAt ?? new Date(),
          },
        },
        { new: true, lean: true },
      )
      .exec();

    return this.map(row);
  }

  async recordAttempt(
    id: string,
    attempt: NotificationDeliveryAttempt,
  ): Promise<NotificationRecord> {
    const row = await this.model
      .findOneAndUpdate(
        { id },
        {
          $push: {
            attempts: attempt,
          },
          $set: {
            retryCount: attempt.attemptNumber,
          },
        },
        { new: true, lean: true },
      )
      .exec();

    return this.map(row);
  }

  async markSent(
    id: string,
    data?: {
      providerId?: string | null;
      providerResponse?: Record<string, unknown> | null;
      sentAt?: Date;
    },
  ): Promise<NotificationRecord> {
    const row = await this.model
      .findOneAndUpdate(
        { id },
        {
          $set: {
            status: 'SENT',
            providerId: data?.providerId ?? null,
            providerResponse: data?.providerResponse ?? null,
            sentAt: data?.sentAt ?? new Date(),
          },
        },
        { new: true, lean: true },
      )
      .exec();

    return this.map(row);
  }

  async markDelivered(
    id: string,
    data?: { deliveredAt?: Date; providerResponse?: Record<string, unknown> | null },
  ): Promise<NotificationRecord> {
    const row = await this.model
      .findOneAndUpdate(
        { id },
        {
          $set: {
            status: 'DELIVERED',
            deliveredAt: data?.deliveredAt ?? new Date(),
            providerResponse: data?.providerResponse ?? null,
          },
        },
        { new: true, lean: true },
      )
      .exec();

    return this.map(row);
  }

  async markFailed(
    id: string,
    data: {
      failureCode?: string | null;
      failureMessage?: string | null;
      nextRetryAt?: Date | null;
      failedAt?: Date;
      providerResponse?: Record<string, unknown> | null;
    },
  ): Promise<NotificationRecord> {
    const row = await this.model
      .findOneAndUpdate(
        { id },
        {
          $inc: { retryCount: 1 },
          $set: {
            status: 'FAILED',
            failureCode: data.failureCode ?? null,
            failureMessage: data.failureMessage ?? null,
            nextRetryAt: data.nextRetryAt ?? null,
            failedAt: data.failedAt ?? new Date(),
            providerResponse: data.providerResponse ?? null,
          },
        },
        { new: true, lean: true },
      )
      .exec();

    return this.map(row);
  }

  private map(row: any): NotificationRecord {
    if (!row) {
      throw new Error('Notification document not found.');
    }

    return {
      id: row.id,
      type: row.type ?? '',
      channel: row.channel as NotificationRecord['channel'],
      templateId: row.templateId ?? null,
      userId: row.userId ?? null,
      recipientEmail: row.recipientEmail ?? null,
      recipientPhone: row.recipientPhone ?? null,
      recipientDevice: row.recipientDevice ?? null,
      recipientSlack: row.recipientSlack ?? null,
      recipientTelegram: row.recipientTelegram ?? null,
      subject: row.subject ?? null,
      title: row.title ?? null,
      body: row.body ?? '',
      htmlBody: row.htmlBody ?? null,
      data: row.data ?? null,
      orderId: row.orderId ?? null,
      batchId: row.batchId ?? null,
      paymentId: row.paymentId ?? null,
      status: row.status as NotificationRecord['status'],
      scheduledAt: row.scheduledAt ?? null,
      queuedAt: row.queuedAt ?? null,
      sentAt: row.sentAt ?? null,
      deliveredAt: row.deliveredAt ?? null,
      openedAt: row.openedAt ?? null,
      clickedAt: row.clickedAt ?? null,
      failedAt: row.failedAt ?? null,
      retryCount: row.retryCount ?? 0,
      maxRetries: row.maxRetries ?? 3,
      nextRetryAt: row.nextRetryAt ?? null,
      failureCode: row.failureCode ?? null,
      failureMessage: row.failureMessage ?? null,
      providerId: row.providerId ?? null,
      providerResponse: row.providerResponse ?? null,
      attempts: row.attempts ?? [],
      metadata: row.metadata ?? null,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    };
  }
}
