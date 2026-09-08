import { Inject, Injectable } from '@nestjs/common';
import type { NotificationChannel } from '@workspace/constants';
import type {
  NotificationTemplatePersistence,
  NotificationTemplatePersistenceQueryOptions,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { NotificationTemplate as PrismaNotificationTemplateModel } from '@workspace/prisma/client';

type NotificationTemplateRow = Partial<PrismaNotificationTemplateModel>;

@Injectable()
export class NotificationTemplateQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof NotificationTemplatePersistence>(
    id: string,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<NotificationTemplateRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).notificationTemplate.findUnique({
      where: { id },
      select: buildPrismaSelect<NotificationTemplatePersistence, K>(options?.select),
    });
  }

  findLatestVersion<K extends keyof NotificationTemplatePersistence>(
    key: string,
    channel: NotificationChannel,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<NotificationTemplateRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).notificationTemplate.findFirst({
      where: { key, channel },
      orderBy: { version: 'desc' },
      select: buildPrismaSelect<NotificationTemplatePersistence, K>(options?.select),
    });
  }

  list<K extends keyof NotificationTemplatePersistence>(
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<NotificationTemplateRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).notificationTemplate.findMany({
      orderBy: { key: 'asc' },
      select: buildPrismaSelect<NotificationTemplatePersistence, K>(options?.select),
    });
  }

  // The port's findBySlug isn't backed by the schema (no `slug` column, and
  // NotificationTemplatePersistence has no slug field either) — treated as
  // "latest active version by key" across channels, the closest sensible
  // meaning given the available columns.
  findByKeyLatestActive<K extends keyof NotificationTemplatePersistence>(
    key: string,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<NotificationTemplateRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).notificationTemplate.findFirst({
      where: { key, isActive: true },
      orderBy: { version: 'desc' },
      select: buildPrismaSelect<NotificationTemplatePersistence, K>(options?.select),
    });
  }
}
