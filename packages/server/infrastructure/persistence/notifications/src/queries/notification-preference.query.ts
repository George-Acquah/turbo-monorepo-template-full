import { Inject, Injectable } from '@nestjs/common';
import type {
  NotificationPreferencePersistence,
  NotificationPreferencePersistenceQueryOptions,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { NotificationPreference as PrismaNotificationPreferenceModel } from '@workspace/prisma/client';

type NotificationPreferenceRow = Partial<PrismaNotificationPreferenceModel>;

@Injectable()
export class NotificationPreferenceQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findPreference<K extends keyof NotificationPreferencePersistence>(
    userId: string,
    category: string,
    channel: string,
    options?: NotificationPreferencePersistenceQueryOptions<K>,
  ): Promise<NotificationPreferenceRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).notificationPreference.findUnique({
      where: { userId_channel_category: { userId, channel, category } },
      select: buildPrismaSelect<NotificationPreferencePersistence, K>(options?.select),
    });
  }

  listUserPreferences<K extends keyof NotificationPreferencePersistence>(
    userId: string,
    options?: NotificationPreferencePersistenceQueryOptions<K>,
  ): Promise<NotificationPreferenceRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).notificationPreference.findMany({
      where: { userId },
      select: buildPrismaSelect<NotificationPreferencePersistence, K>(options?.select),
    });
  }
}
