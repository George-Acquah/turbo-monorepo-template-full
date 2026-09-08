import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  NotificationChannelConfigRepositoryPort,
  type NotificationChannelConfigPersistence,
  type CreateNotificationChannelConfigInput,
  type NotificationChannelConfigPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { NotificationConfigConverter } from '../converter/notification-config.converter';
import { NotificationChannelConfigQuery } from '../queries/notification-channel-config.query';

@Injectable()
export class PrismaNotificationChannelConfigAdapter implements NotificationChannelConfigRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly channelConfigQuery: NotificationChannelConfigQuery,
  ) {}

  async create<
    K extends keyof NotificationChannelConfigPersistence = keyof NotificationChannelConfigPersistence,
  >(
    data: CreateNotificationChannelConfigInput,
    tx?: DatabaseTx,
  ): Promise<Pick<NotificationChannelConfigPersistence, K>> {
    const { settings, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).notificationChannelConfig.create({
      data: { id: generateId(IdPrefixes.NOTIFICATION_CHANNEL_CONFIG), ...rest, settings: settings ?? undefined },
    });
    return NotificationConfigConverter.toChannelConfigPersistence(row) as Pick<
      NotificationChannelConfigPersistence,
      K
    >;
  }

  async findProvider<
    K extends keyof NotificationChannelConfigPersistence = keyof NotificationChannelConfigPersistence,
  >(
    channel: string,
    provider: string,
    tx?: DatabaseTx,
    options?: NotificationChannelConfigPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationChannelConfigPersistence, K> | null> {
    const row = await this.channelConfigQuery.findProvider(channel, provider, { ...options, tx });
    return row
      ? (NotificationConfigConverter.toChannelConfigPartialPersistence(row) as Pick<
          NotificationChannelConfigPersistence,
          K
        >)
      : null;
  }

  async findDefaultProvider<
    K extends keyof NotificationChannelConfigPersistence = keyof NotificationChannelConfigPersistence,
  >(
    channel: string,
    tx?: DatabaseTx,
    options?: NotificationChannelConfigPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationChannelConfigPersistence, K> | null> {
    const row = await this.channelConfigQuery.findDefaultProvider(channel, { ...options, tx });
    return row
      ? (NotificationConfigConverter.toChannelConfigPartialPersistence(row) as Pick<
          NotificationChannelConfigPersistence,
          K
        >)
      : null;
  }

  async listProviders<
    K extends keyof NotificationChannelConfigPersistence = keyof NotificationChannelConfigPersistence,
  >(
    channel?: string,
    tx?: DatabaseTx,
    options?: NotificationChannelConfigPersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationChannelConfigPersistence, K>[]> {
    const rows = await this.channelConfigQuery.listProviders(channel, { ...options, tx });
    return rows.map(
      (row) =>
        NotificationConfigConverter.toChannelConfigPartialPersistence(row) as Pick<
          NotificationChannelConfigPersistence,
          K
        >,
    );
  }

  async activate(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).notificationChannelConfig.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).notificationChannelConfig.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async makeDefault(id: string, tx?: DatabaseTx): Promise<void> {
    const client = resolvePrismaClient(tx, this.prisma);
    const target = await client.notificationChannelConfig.findUniqueOrThrow({
      where: { id },
      select: { channel: true },
    });
    await client.notificationChannelConfig.updateMany({
      where: { channel: target.channel, isDefault: true },
      data: { isDefault: false },
    });
    await client.notificationChannelConfig.update({ where: { id }, data: { isDefault: true } });
  }
}
