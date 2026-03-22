import {
  type NotificationConfigRecord,
  NotificationConfigStorePort,
  type UpsertNotificationConfigInput,
} from '@repo/ports';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  NotificationConfigModelName,
  type NotificationConfigDocument,
} from '../../schemas/notifications/notification-config.schema';
import { generateDocumentId } from '../../utils/document-id';

@Injectable()
export class MongoNotificationConfigStoreAdapter implements NotificationConfigStorePort {
  constructor(
    @InjectModel(NotificationConfigModelName)
    private readonly model: Model<NotificationConfigDocument>,
  ) {}

  async upsert(data: UpsertNotificationConfigInput): Promise<NotificationConfigRecord> {
    const row = await this.model
      .findOneAndUpdate(
        { channel: data.channel },
        {
          $set: data,
          $setOnInsert: {
            id: generateDocumentId('ncf'),
          },
        },
        { new: true, upsert: true, lean: true },
      )
      .exec();

    return this.map(row);
  }

  async getByChannel(channel: string): Promise<NotificationConfigRecord | null> {
    const row = await this.model.findOne({ channel }).lean().exec();
    return row ? this.map(row) : null;
  }

  async listActive(): Promise<NotificationConfigRecord[]> {
    const rows = await this.model.find({ isActive: true }).sort({ channel: 1 }).lean().exec();
    return rows.map((row) => this.map(row));
  }

  private map(row: any): NotificationConfigRecord {
    return {
      id: row.id,
      channel: row.channel as NotificationConfigRecord['channel'],
      provider: row.provider ?? '',
      apiKey: row.apiKey ?? null,
      apiSecret: row.apiSecret ?? null,
      fromEmail: row.fromEmail ?? null,
      fromName: row.fromName ?? null,
      fromPhone: row.fromPhone ?? null,
      slackWebhook: row.slackWebhook ?? null,
      telegramBotToken: row.telegramBotToken ?? null,
      rateLimit: row.rateLimit ?? null,
      dailyLimit: row.dailyLimit ?? null,
      isActive: row.isActive ?? true,
      metadata: row.metadata ?? null,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    };
  }
}
