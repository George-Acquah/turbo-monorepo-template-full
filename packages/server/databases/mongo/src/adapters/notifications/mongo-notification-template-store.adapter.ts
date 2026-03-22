import {
  type NotificationTemplateRecord,
  NotificationTemplateStorePort,
  type UpsertNotificationTemplateInput,
} from '@repo/ports';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  NotificationTemplateModelName,
  type NotificationTemplateDocument,
} from '../../schemas/notifications/notification-template.schema';
import { generateDocumentId } from '../../utils/document-id';

@Injectable()
export class MongoNotificationTemplateStoreAdapter implements NotificationTemplateStorePort {
  constructor(
    @InjectModel(NotificationTemplateModelName)
    private readonly model: Model<NotificationTemplateDocument>,
  ) {}

  async upsert(data: UpsertNotificationTemplateInput): Promise<NotificationTemplateRecord> {
    const row = await this.model
      .findOneAndUpdate(
        { slug: data.slug },
        {
          $set: {
            ...data,
            deletedAt: null,
          },
          $setOnInsert: {
            id: generateDocumentId('ntpl'),
          },
        },
        { new: true, upsert: true, lean: true },
      )
      .exec();

    return this.map(row);
  }

  async findById(id: string): Promise<NotificationTemplateRecord | null> {
    const row = await this.model.findOne({ id }).lean().exec();
    return row ? this.map(row) : null;
  }

  async findBySlug(slug: string): Promise<NotificationTemplateRecord | null> {
    const row = await this.model.findOne({ slug, deletedAt: null }).lean().exec();
    return row ? this.map(row) : null;
  }

  async listActive(): Promise<NotificationTemplateRecord[]> {
    const rows = await this.model
      .find({ isActive: true, deletedAt: null })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    return rows.map((row) => this.map(row));
  }

  private map(row: any): NotificationTemplateRecord {
    return {
      id: row.id,
      name: row.name ?? '',
      slug: row.slug ?? '',
      type: row.type ?? '',
      channels: (row.channels ?? []) as NotificationTemplateRecord['channels'],
      emailSubject: row.emailSubject ?? null,
      emailHtml: row.emailHtml ?? null,
      emailText: row.emailText ?? null,
      smsBody: row.smsBody ?? null,
      pushTitle: row.pushTitle ?? null,
      pushBody: row.pushBody ?? null,
      pushData: row.pushData ?? null,
      inAppTitle: row.inAppTitle ?? null,
      inAppBody: row.inAppBody ?? null,
      inAppAction: row.inAppAction ?? null,
      slackMessage: row.slackMessage ?? null,
      telegramMessage: row.telegramMessage ?? null,
      whatsappTemplateId: row.whatsappTemplateId ?? null,
      whatsappParams: row.whatsappParams ?? null,
      variables: row.variables ?? [],
      isActive: row.isActive ?? true,
      description: row.description ?? null,
      metadata: row.metadata ?? null,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
      deletedAt: row.deletedAt ?? null,
    };
  }
}
