import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type {
  NotificationDeliveryPersistence,
  NotificationDeliveryPersistenceQueryOptions,
} from '@workspace/ports';
import {
  NotificationDelivery,
  MONGO_CONNECTION_NAME,
  type NotificationDeliveryDocument,
} from '@workspace/mongo';
import { applySelect } from '../utils/mongo-select';
import type { LeanRecord } from '../utils/mongo-lean';

@Injectable()
export class NotificationDeliveryQuery {
  constructor(
    @InjectModel(NotificationDelivery.name, MONGO_CONNECTION_NAME)
    private readonly model: Model<NotificationDeliveryDocument>,
  ) {}

  findById<K extends keyof NotificationDeliveryPersistence>(
    id: string,
    options?: NotificationDeliveryPersistenceQueryOptions<K>,
  ): Promise<LeanRecord | null> {
    const query = this.model.findById(id);
    applySelect(query, options?.select);
    return query.lean().exec();
  }

  findByNotification<K extends keyof NotificationDeliveryPersistence>(
    notificationId: string,
    options?: NotificationDeliveryPersistenceQueryOptions<K>,
  ): Promise<LeanRecord[]> {
    const query = this.model.find({ notificationId }).sort({ attemptNumber: 1 });
    applySelect(query, options?.select);
    return query.lean().exec();
  }
}
