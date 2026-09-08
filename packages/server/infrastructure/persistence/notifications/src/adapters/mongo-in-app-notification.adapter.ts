import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  InAppNotificationStorePort,
  type InAppNotificationPersistence,
  type CreateInAppNotificationInput,
  type InAppNotificationPersistenceQueryOptions,
} from '@workspace/ports';
import {
  InAppNotification,
  MONGO_CONNECTION_NAME,
  type InAppNotificationDocument,
} from '@workspace/mongo';
import { NotificationRecordConverter } from '../converter/notification-record.converter';
import { InAppNotificationQuery } from '../queries/in-app-notification.query';
import { applySelect } from '../utils/mongo-select';

@Injectable()
export class MongoInAppNotificationAdapter implements InAppNotificationStorePort {
  constructor(
    @InjectModel(InAppNotification.name, MONGO_CONNECTION_NAME)
    private readonly model: Model<InAppNotificationDocument>,
    private readonly inAppNotificationQuery: InAppNotificationQuery,
  ) {}

  async create<
    K extends keyof InAppNotificationPersistence = keyof InAppNotificationPersistence,
  >(
    data: CreateInAppNotificationInput,
    options?: InAppNotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<InAppNotificationPersistence, K>> {
    const doc = await this.model.create({
      _id: generateId(IdPrefixes.IN_APP_NOTIFICATION),
      ...data,
      read: false,
      archived: false,
    });
    const query = this.model.findById(doc._id);
    applySelect(query, options?.select);
    const row = await query.lean().exec();
    return NotificationRecordConverter.toInAppNotificationPersistence(row!) as Pick<
      InAppNotificationPersistence,
      K
    >;
  }

  async createMany(inputs: CreateInAppNotificationInput[]): Promise<void> {
    if (inputs.length === 0) return;
    await this.model.insertMany(
      inputs.map((data) => ({
        _id: generateId(IdPrefixes.IN_APP_NOTIFICATION),
        ...data,
        read: false,
        archived: false,
      })),
      { ordered: false },
    );
  }

  async findById<
    K extends keyof InAppNotificationPersistence = keyof InAppNotificationPersistence,
  >(
    id: string,
    options?: InAppNotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<InAppNotificationPersistence, K> | null> {
    const row = await this.inAppNotificationQuery.findById(id, options);
    return row
      ? (NotificationRecordConverter.toInAppNotificationPersistence(row) as Pick<
          InAppNotificationPersistence,
          K
        >)
      : null;
  }

  async listForProfile<
    K extends keyof InAppNotificationPersistence = keyof InAppNotificationPersistence,
  >(
    profileId: string,
    listOptions?: { unreadOnly?: boolean; archived?: boolean; limit?: number; offset?: number },
    queryOptions?: InAppNotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<InAppNotificationPersistence, K>[]> {
    const rows = await this.inAppNotificationQuery.listForProfile(
      profileId,
      listOptions,
      queryOptions,
    );
    return rows.map(
      (row) =>
        NotificationRecordConverter.toInAppNotificationPersistence(row) as Pick<
          InAppNotificationPersistence,
          K
        >,
    );
  }

  countForProfile(
    profileId: string,
    options?: { unreadOnly?: boolean; archived?: boolean },
  ): Promise<number> {
    return this.inAppNotificationQuery.countForProfile(profileId, options);
  }

  async listForUser<
    K extends keyof InAppNotificationPersistence = keyof InAppNotificationPersistence,
  >(
    userId: string,
    listOptions?: { unreadOnly?: boolean; archived?: boolean; limit?: number; offset?: number },
    queryOptions?: InAppNotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<InAppNotificationPersistence, K>[]> {
    const rows = await this.inAppNotificationQuery.listForUser(userId, listOptions, queryOptions);
    return rows.map(
      (row) =>
        NotificationRecordConverter.toInAppNotificationPersistence(row) as Pick<
          InAppNotificationPersistence,
          K
        >,
    );
  }

  countForUser(
    userId: string,
    options?: { unreadOnly?: boolean; archived?: boolean },
  ): Promise<number> {
    return this.inAppNotificationQuery.countForUser(userId, options);
  }

  async markRead(inAppId: string, readAt?: Date): Promise<void> {
    await this.model
      .updateOne({ _id: inAppId }, { read: true, readAt: readAt ?? new Date() })
      .exec();
  }

  async archive(inAppId: string, archivedAt?: Date): Promise<void> {
    await this.model
      .updateOne({ _id: inAppId }, { archived: true, archivedAt: archivedAt ?? new Date() })
      .exec();
  }

  async markAllRead(profileId: string): Promise<number> {
    const result = await this.model
      .updateMany({ profileId, read: false }, { read: true, readAt: new Date() })
      .exec();
    return result.modifiedCount;
  }

  async markAllReadForUser(userId: string): Promise<number> {
    const result = await this.model
      .updateMany({ userId, read: false }, { read: true, readAt: new Date() })
      .exec();
    return result.modifiedCount;
  }
}
