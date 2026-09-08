import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  NotificationPreferenceRepositoryPort,
  type NotificationPreferencePersistence,
  type CreateNotificationPreferenceInput,
  type NotificationPreferencePersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { NotificationConfigConverter } from '../converter/notification-config.converter';
import { NotificationPreferenceQuery } from '../queries/notification-preference.query';

@Injectable()
export class PrismaNotificationPreferenceAdapter implements NotificationPreferenceRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly preferenceQuery: NotificationPreferenceQuery,
  ) {}

  async create<
    K extends keyof NotificationPreferencePersistence = keyof NotificationPreferencePersistence,
  >(
    data: CreateNotificationPreferenceInput,
    tx?: DatabaseTx,
  ): Promise<Pick<NotificationPreferencePersistence, K>> {
    const row = await resolvePrismaClient(tx, this.prisma).notificationPreference.create({
      data: { id: generateId(IdPrefixes.NOTIFICATION_PREFERENCE), ...data },
    });
    return NotificationConfigConverter.toPreferencePersistence(row) as Pick<
      NotificationPreferencePersistence,
      K
    >;
  }

  async upsert<
    K extends keyof NotificationPreferencePersistence = keyof NotificationPreferencePersistence,
  >(
    data: CreateNotificationPreferenceInput,
    tx?: DatabaseTx,
  ): Promise<Pick<NotificationPreferencePersistence, K>> {
    const { userId, channel, category, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).notificationPreference.upsert({
      where: { userId_channel_category: { userId, channel, category } },
      create: { id: generateId(IdPrefixes.NOTIFICATION_PREFERENCE), userId, channel, category, ...rest },
      update: rest,
    });
    return NotificationConfigConverter.toPreferencePersistence(row) as Pick<
      NotificationPreferencePersistence,
      K
    >;
  }

  async findPreference<
    K extends keyof NotificationPreferencePersistence = keyof NotificationPreferencePersistence,
  >(
    userId: string,
    category: string,
    channel: string,
    tx?: DatabaseTx,
    options?: NotificationPreferencePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPreferencePersistence, K> | null> {
    const row = await this.preferenceQuery.findPreference(userId, category, channel, {
      ...options,
      tx,
    });
    return row
      ? (NotificationConfigConverter.toPreferencePartialPersistence(row) as Pick<
          NotificationPreferencePersistence,
          K
        >)
      : null;
  }

  async listUserPreferences<
    K extends keyof NotificationPreferencePersistence = keyof NotificationPreferencePersistence,
  >(
    userId: string,
    tx?: DatabaseTx,
    options?: NotificationPreferencePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationPreferencePersistence, K>[]> {
    const rows = await this.preferenceQuery.listUserPreferences(userId, { ...options, tx });
    return rows.map(
      (row) =>
        NotificationConfigConverter.toPreferencePartialPersistence(row) as Pick<
          NotificationPreferencePersistence,
          K
        >,
    );
  }

  async enable(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).notificationPreference.update({
      where: { id },
      data: { enabled: true },
    });
  }

  async disable(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).notificationPreference.update({
      where: { id },
      data: { enabled: false },
    });
  }
}
