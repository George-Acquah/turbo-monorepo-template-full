import { Inject, Injectable } from '@nestjs/common';
import type {
  NotificationChannelConfigPersistence,
  NotificationChannelConfigPersistenceQueryOptions,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { NotificationChannelConfig as PrismaChannelConfigModel } from '@workspace/prisma/client';

type ChannelConfigRow = Partial<PrismaChannelConfigModel>;

@Injectable()
export class NotificationChannelConfigQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findProvider<K extends keyof NotificationChannelConfigPersistence>(
    channel: string,
    provider: string,
    options?: NotificationChannelConfigPersistenceQueryOptions<K>,
  ): Promise<ChannelConfigRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).notificationChannelConfig.findUnique({
      where: { channel_provider: { channel, provider } },
      select: buildPrismaSelect<NotificationChannelConfigPersistence, K>(options?.select),
    });
  }

  findDefaultProvider<K extends keyof NotificationChannelConfigPersistence>(
    channel: string,
    options?: NotificationChannelConfigPersistenceQueryOptions<K>,
  ): Promise<ChannelConfigRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).notificationChannelConfig.findFirst({
      where: { channel, isDefault: true },
      select: buildPrismaSelect<NotificationChannelConfigPersistence, K>(options?.select),
    });
  }

  listProviders<K extends keyof NotificationChannelConfigPersistence>(
    channel: string | undefined,
    options?: NotificationChannelConfigPersistenceQueryOptions<K>,
  ): Promise<ChannelConfigRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).notificationChannelConfig.findMany({
      where: { channel },
      select: buildPrismaSelect<NotificationChannelConfigPersistence, K>(options?.select),
    });
  }
}
