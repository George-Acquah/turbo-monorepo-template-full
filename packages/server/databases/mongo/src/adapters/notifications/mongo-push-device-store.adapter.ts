import { type PushDeviceRecord, PushDeviceStorePort, type UpsertPushDeviceInput } from '@repo/ports';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  PushDeviceModelName,
  type PushDeviceDocument,
} from '../../schemas/notifications/push-device.schema';
import { generateDocumentId } from '../../utils/document-id';

@Injectable()
export class MongoPushDeviceStoreAdapter implements PushDeviceStorePort {
  constructor(
    @InjectModel(PushDeviceModelName)
    private readonly model: Model<PushDeviceDocument>,
  ) {}

  async upsert(data: UpsertPushDeviceInput): Promise<PushDeviceRecord> {
    const row = await this.model
      .findOneAndUpdate(
        { token: data.token },
        {
          $set: {
            ...data,
            isActive: data.isActive ?? true,
            lastActiveAt: new Date(),
          },
          $setOnInsert: {
            id: generateDocumentId('pdt'),
          },
        },
        { new: true, upsert: true, lean: true },
      )
      .exec();

    return this.map(row);
  }

  async listActiveForUser(userId: string): Promise<PushDeviceRecord[]> {
    const rows = await this.model.find({ userId, isActive: true }).lean().exec();
    return rows.map((row) => this.map(row));
  }

  async deactivate(token: string): Promise<void> {
    await this.model
      .updateOne(
        { token },
        {
          $set: {
            isActive: false,
          },
        },
      )
      .exec();
  }

  private map(row: any): PushDeviceRecord {
    return {
      id: row.id,
      userId: row.userId ?? '',
      token: row.token ?? '',
      platform: row.platform ?? '',
      deviceId: row.deviceId ?? null,
      deviceModel: row.deviceModel ?? null,
      osVersion: row.osVersion ?? null,
      appVersion: row.appVersion ?? null,
      isActive: row.isActive ?? true,
      lastActiveAt: row.lastActiveAt ?? null,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    };
  }
}
