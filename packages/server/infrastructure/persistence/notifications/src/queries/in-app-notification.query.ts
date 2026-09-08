import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type {
  InAppNotificationPersistence,
  InAppNotificationPersistenceQueryOptions,
} from '@workspace/ports';
import {
  InAppNotification,
  MONGO_CONNECTION_NAME,
  type InAppNotificationDocument,
} from '@workspace/mongo';
import { applySelect } from '../utils/mongo-select';
import type { LeanRecord } from '../utils/mongo-lean';

@Injectable()
export class InAppNotificationQuery {
  constructor(
    @InjectModel(InAppNotification.name, MONGO_CONNECTION_NAME)
    private readonly model: Model<InAppNotificationDocument>,
  ) {}

  findById<K extends keyof InAppNotificationPersistence>(
    id: string,
    options?: InAppNotificationPersistenceQueryOptions<K>,
  ): Promise<LeanRecord | null> {
    const query = this.model.findById(id);
    applySelect(query, options?.select);
    return query.lean().exec();
  }

  listForProfile<K extends keyof InAppNotificationPersistence>(
    profileId: string,
    listOptions?: { unreadOnly?: boolean; archived?: boolean; limit?: number; offset?: number },
    queryOptions?: InAppNotificationPersistenceQueryOptions<K>,
  ): Promise<LeanRecord[]> {
    const filter: Record<string, unknown> = { profileId };
    if (listOptions?.unreadOnly) filter.read = false;
    if (listOptions?.archived !== undefined) filter.archived = listOptions.archived;

    const query = this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(listOptions?.offset ?? 0)
      .limit(listOptions?.limit ?? 50);
    applySelect(query, queryOptions?.select);
    return query.lean().exec();
  }

  countForProfile(profileId: string, options?: { unreadOnly?: boolean; archived?: boolean }): Promise<number> {
    const filter: Record<string, unknown> = { profileId };
    if (options?.unreadOnly) filter.read = false;
    if (options?.archived !== undefined) filter.archived = options.archived;
    return this.model.countDocuments(filter).exec();
  }

  listForUser<K extends keyof InAppNotificationPersistence>(
    userId: string,
    listOptions?: { unreadOnly?: boolean; archived?: boolean; limit?: number; offset?: number },
    queryOptions?: InAppNotificationPersistenceQueryOptions<K>,
  ): Promise<LeanRecord[]> {
    const filter: Record<string, unknown> = { userId };
    if (listOptions?.unreadOnly) filter.read = false;
    if (listOptions?.archived !== undefined) filter.archived = listOptions.archived;

    const query = this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(listOptions?.offset ?? 0)
      .limit(listOptions?.limit ?? 50);
    applySelect(query, queryOptions?.select);
    return query.lean().exec();
  }

  countForUser(userId: string, options?: { unreadOnly?: boolean; archived?: boolean }): Promise<number> {
    const filter: Record<string, unknown> = { userId };
    if (options?.unreadOnly) filter.read = false;
    if (options?.archived !== undefined) filter.archived = options.archived;
    return this.model.countDocuments(filter).exec();
  }
}
