import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IdPrefixes, type NotificationStatus } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  NotificationStorePort,
  type NotificationPersistence,
  type CreateNotificationInput,
  type NotificationPersistenceQueryOptions,
} from '@workspace/ports';
import { Notification, MONGO_CONNECTION_NAME, type NotificationDocument } from '@workspace/mongo';
import { NotificationRecordConverter } from '../converter/notification-record.converter';
import { NotificationQuery } from '../queries/notification.query';
import { applySelect } from '../utils/mongo-select';

@Injectable()
export class MongoNotificationAdapter implements NotificationStorePort {
  constructor(
    @InjectModel(Notification.name, MONGO_CONNECTION_NAME)
    private readonly model: Model<NotificationDocument>,
    private readonly notificationQuery: NotificationQuery,
  ) {}

  async create<K extends keyof NotificationPersistence = keyof NotificationPersistence>(
    data: CreateNotificationInput,
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPersistence, K>> {
    const doc = await this.model.create({ _id: generateId(IdPrefixes.NOTIFICATION), ...data });
    const query = this.model.findById(doc._id);
    applySelect(query, options?.select);
    const row = await query.lean().exec();
    return NotificationRecordConverter.toNotificationPersistence(row!) as Pick<
      NotificationPersistence,
      K
    >;
  }

  async findById<K extends keyof NotificationPersistence = keyof NotificationPersistence>(
    id: string,
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPersistence, K> | null> {
    const row = await this.notificationQuery.findById(id, options);
    return row
      ? (NotificationRecordConverter.toNotificationPersistence(row) as Pick<
          NotificationPersistence,
          K
        >)
      : null;
  }

  async findManyByIds<K extends keyof NotificationPersistence = keyof NotificationPersistence>(
    ids: string[],
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPersistence, K>[]> {
    const rows = await this.notificationQuery.findManyByIds(ids, options);
    return rows.map(
      (row) =>
        NotificationRecordConverter.toNotificationPersistence(row) as Pick<
          NotificationPersistence,
          K
        >,
    );
  }

  async findPending<K extends keyof NotificationPersistence = keyof NotificationPersistence>(
    limit: number,
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPersistence, K>[]> {
    const rows = await this.notificationQuery.findPending(limit, options);
    return rows.map(
      (row) =>
        NotificationRecordConverter.toNotificationPersistence(row) as Pick<
          NotificationPersistence,
          K
        >,
    );
  }

  async updateStatus<K extends keyof NotificationPersistence = keyof NotificationPersistence>(
    id: string,
    status: NotificationStatus,
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPersistence, K>> {
    const query = this.model.findByIdAndUpdate(id, { status }, { new: true });
    applySelect(query, options?.select);
    const row = await query.lean().exec();
    return NotificationRecordConverter.toNotificationPersistence(row!) as Pick<
      NotificationPersistence,
      K
    >;
  }

  async cancel<K extends keyof NotificationPersistence = keyof NotificationPersistence>(
    id: string,
    options?: NotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPersistence, K>> {
    return this.updateStatus(id, 'CANCELLED', options);
  }
}
