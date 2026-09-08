import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IdPrefixes, type NotificationDeliveryStatus } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  NotificationDeliveryStorePort,
  type NotificationDeliveryPersistence,
  type CreateNotificationDeliveryInput,
  type NotificationDeliveryPersistenceQueryOptions,
  type NotificationDeliveryMutationResult,
} from '@workspace/ports';
import {
  NotificationDelivery,
  MONGO_CONNECTION_NAME,
  type NotificationDeliveryDocument,
} from '@workspace/mongo';
import { NotificationRecordConverter } from '../converter/notification-record.converter';
import { NotificationDeliveryQuery } from '../queries/notification-delivery.query';
import { applySelect } from '../utils/mongo-select';

@Injectable()
export class MongoNotificationDeliveryAdapter implements NotificationDeliveryStorePort {
  constructor(
    @InjectModel(NotificationDelivery.name, MONGO_CONNECTION_NAME)
    private readonly model: Model<NotificationDeliveryDocument>,
    private readonly deliveryQuery: NotificationDeliveryQuery,
  ) {}

  async create<
    K extends keyof NotificationDeliveryPersistence = keyof NotificationDeliveryPersistence,
  >(
    data: CreateNotificationDeliveryInput,
    options?: NotificationDeliveryPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationDeliveryPersistence, K>> {
    const doc = await this.model.create({
      _id: generateId(IdPrefixes.NOTIFICATION_DELIVERY),
      ...data,
      status: 'PENDING',
    });
    const query = this.model.findById(doc._id);
    applySelect(query, options?.select);
    const row = await query.lean().exec();
    return NotificationRecordConverter.toNotificationDeliveryPersistence(row!) as Pick<
      NotificationDeliveryPersistence,
      K
    >;
  }

  async findById<
    K extends keyof NotificationDeliveryPersistence = keyof NotificationDeliveryPersistence,
  >(
    id: string,
    options?: NotificationDeliveryPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationDeliveryPersistence, K> | null> {
    const row = await this.deliveryQuery.findById(id, options);
    return row
      ? (NotificationRecordConverter.toNotificationDeliveryPersistence(row) as Pick<
          NotificationDeliveryPersistence,
          K
        >)
      : null;
  }

  async findByNotification<
    K extends keyof NotificationDeliveryPersistence = keyof NotificationDeliveryPersistence,
  >(
    notificationId: string,
    options?: NotificationDeliveryPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationDeliveryPersistence, K>[]> {
    const rows = await this.deliveryQuery.findByNotification(notificationId, options);
    return rows.map(
      (row) =>
        NotificationRecordConverter.toNotificationDeliveryPersistence(row) as Pick<
          NotificationDeliveryPersistence,
          K
        >,
    );
  }

  async findPendingAndFailedByNotification<
    K extends keyof NotificationDeliveryPersistence = keyof NotificationDeliveryPersistence,
  >(
    notificationId: string,
    options?: NotificationDeliveryPersistenceQueryOptions<K>,
  ): Promise<{
    pending: Pick<NotificationDeliveryPersistence, K>[];
    failed: Pick<NotificationDeliveryPersistence, K>[];
  }> {
    const rows = await this.deliveryQuery.findByNotification(notificationId, options);
    const converted = rows.map(
      (row) =>
        NotificationRecordConverter.toNotificationDeliveryPersistence(row) as Pick<
          NotificationDeliveryPersistence,
          K
        >,
    );
    return {
      pending: converted.filter((row) => (row as { status?: string }).status === 'PENDING'),
      failed: converted.filter((row) => (row as { status?: string }).status === 'FAILED'),
    };
  }

  async markQueued(deliveryId: string): Promise<void> {
    await this.model.updateOne({ _id: deliveryId }, { status: 'QUEUED' }).exec();
  }

  async markSent(
    deliveryId: string,
    data: { providerMessageId?: string; responsePayload?: Record<string, unknown>; sentAt?: Date },
  ): Promise<NotificationDeliveryMutationResult | null> {
    const row = await this.model
      .findByIdAndUpdate(
        deliveryId,
        { status: 'SENT', sentAt: data.sentAt ?? new Date(), ...data },
        { new: true },
      )
      .lean()
      .exec();
    return row ? this.toMutationResult(row) : null;
  }

  async markDelivered(
    deliveryId: string,
    data?: { deliveredAt?: Date; responsePayload?: Record<string, unknown> },
  ): Promise<NotificationDeliveryMutationResult | null> {
    const row = await this.model
      .findByIdAndUpdate(
        deliveryId,
        { status: 'DELIVERED', deliveredAt: data?.deliveredAt ?? new Date(), ...data },
        { new: true },
      )
      .lean()
      .exec();
    return row ? this.toMutationResult(row) : null;
  }

  async markFailed(
    deliveryId: string,
    data: {
      errorCode?: string;
      errorMessage?: string;
      responsePayload?: Record<string, unknown>;
      failedAt?: Date;
    },
  ): Promise<NotificationDeliveryMutationResult | null> {
    const row = await this.model
      .findByIdAndUpdate(
        deliveryId,
        { status: 'FAILED', failedAt: data.failedAt ?? new Date(), ...data },
        { new: true },
      )
      .lean()
      .exec();
    return row ? this.toMutationResult(row) : null;
  }

  async updateStatus(deliveryId: string, status: NotificationDeliveryStatus): Promise<void> {
    await this.model.updateOne({ _id: deliveryId }, { status }).exec();
  }

  // tenantId is a legacy multi-tenant leftover with no backing field on this
  // single-tenant schema — always empty.
  private toMutationResult(row: { notificationId: string }): NotificationDeliveryMutationResult {
    return { tenantId: '', notificationId: row.notificationId };
  }
}
