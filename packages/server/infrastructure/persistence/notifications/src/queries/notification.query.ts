import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { NotificationPersistence, NotificationPersistenceQueryOptions } from '@workspace/ports';
import { Notification, MONGO_CONNECTION_NAME, type NotificationDocument } from '@workspace/mongo';
import { applySelect } from '../utils/mongo-select';
import type { LeanRecord } from '../utils/mongo-lean';

@Injectable()
export class NotificationQuery {
  constructor(
    @InjectModel(Notification.name, MONGO_CONNECTION_NAME)
    private readonly model: Model<NotificationDocument>,
  ) {}

  findById<K extends keyof NotificationPersistence>(
    id: string,
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<LeanRecord | null> {
    const query = this.model.findById(id);
    applySelect(query, options?.select);
    return query.lean().exec();
  }

  findManyByIds<K extends keyof NotificationPersistence>(
    ids: string[],
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<LeanRecord[]> {
    const query = this.model.find({ _id: { $in: ids } });
    applySelect(query, options?.select);
    return query.lean().exec();
  }

  findPending<K extends keyof NotificationPersistence>(
    limit: number,
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<LeanRecord[]> {
    const query = this.model
      .find({ status: 'PENDING', $or: [{ scheduledAt: null }, { scheduledAt: { $lte: new Date() } }] })
      .sort({ createdAt: 1 })
      .limit(limit);
    applySelect(query, options?.select);
    return query.lean().exec();
  }
}
