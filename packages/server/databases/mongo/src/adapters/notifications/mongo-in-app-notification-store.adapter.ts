import {
  type CreateInAppNotificationInput,
  type InAppNotificationRecord,
  InAppNotificationStorePort,
} from '@repo/ports';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  InAppNotificationModelName,
  type InAppNotificationDocument,
} from '../../schemas/notifications/in-app-notification.schema';
import { generateDocumentId } from '../../utils/document-id';

@Injectable()
export class MongoInAppNotificationStoreAdapter implements InAppNotificationStorePort {
  constructor(
    @InjectModel(InAppNotificationModelName)
    private readonly model: Model<InAppNotificationDocument>,
  ) {}

  async create(data: CreateInAppNotificationInput): Promise<InAppNotificationRecord> {
    const created = await this.model.create({
      id: generateDocumentId('ian'),
      ...data,
      isRead: false,
      isDismissed: false,
    });

    return this.map(created.toObject());
  }

  async listForUser(
    userId: string,
    options?: { unreadOnly?: boolean },
  ): Promise<InAppNotificationRecord[]> {
    const rows = await this.model
      .find({
        userId,
        ...(options?.unreadOnly ? { isRead: false } : {}),
        $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return rows.map((row) => this.map(row));
  }

  async markRead(id: string, readAt?: Date): Promise<void> {
    await this.model
      .updateOne(
        { id },
        {
          $set: {
            isRead: true,
            readAt: readAt ?? new Date(),
          },
        },
      )
      .exec();
  }

  async dismiss(id: string, dismissedAt?: Date): Promise<void> {
    await this.model
      .updateOne(
        { id },
        {
          $set: {
            isDismissed: true,
            dismissedAt: dismissedAt ?? new Date(),
          },
        },
      )
      .exec();
  }

  private map(row: any): InAppNotificationRecord {
    return {
      id: row.id,
      userId: row.userId ?? '',
      type: row.type ?? '',
      title: row.title ?? '',
      body: row.body ?? '',
      actionUrl: row.actionUrl ?? null,
      imageUrl: row.imageUrl ?? null,
      orderId: row.orderId ?? null,
      batchId: row.batchId ?? null,
      isRead: row.isRead ?? false,
      readAt: row.readAt ?? null,
      isDismissed: row.isDismissed ?? false,
      dismissedAt: row.dismissedAt ?? null,
      expiresAt: row.expiresAt ?? null,
      metadata: row.metadata ?? null,
      createdAt: row.createdAt ?? new Date(),
    };
  }
}
