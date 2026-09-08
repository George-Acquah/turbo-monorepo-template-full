import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import type { NotificationChannel } from '@workspace/constants';
import {
  NotificationTemplateRepositoryPort,
  type NotificationTemplatePersistence,
  type CreateNotificationTemplateInput,
  type UpdateNotificationTemplateInput,
  type NotificationTemplatePersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { NotificationConfigConverter } from '../converter/notification-config.converter';
import { NotificationTemplateQuery } from '../queries/notification-template.query';

@Injectable()
export class PrismaNotificationTemplateAdapter implements NotificationTemplateRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly templateQuery: NotificationTemplateQuery,
  ) {}

  async create<K extends keyof NotificationTemplatePersistence = keyof NotificationTemplatePersistence>(
    data: CreateNotificationTemplateInput,
    tx?: DatabaseTx,
  ): Promise<Pick<NotificationTemplatePersistence, K>> {
    const { variables, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).notificationTemplate.create({
      data: { id: generateId(IdPrefixes.NOTIFICATION_TEMPLATE), ...rest, variables: variables ?? undefined },
    });
    return NotificationConfigConverter.toTemplatePersistence(row) as Pick<
      NotificationTemplatePersistence,
      K
    >;
  }

  async update<K extends keyof NotificationTemplatePersistence = keyof NotificationTemplatePersistence>(
    id: string,
    data: UpdateNotificationTemplateInput,
    tx?: DatabaseTx,
  ): Promise<Pick<NotificationTemplatePersistence, K>> {
    const { variables, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).notificationTemplate.update({
      where: { id },
      data: { ...rest, variables: variables ?? undefined },
    });
    return NotificationConfigConverter.toTemplatePersistence(row) as Pick<
      NotificationTemplatePersistence,
      K
    >;
  }

  async findById<K extends keyof NotificationTemplatePersistence = keyof NotificationTemplatePersistence>(
    id: string,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationTemplatePersistence, K> | null> {
    const row = await this.templateQuery.findById(id, options);
    return row
      ? (NotificationConfigConverter.toTemplatePartialPersistence(row) as Pick<
          NotificationTemplatePersistence,
          K
        >)
      : null;
  }

  // tenantId is a legacy multi-tenant leftover — single-tenant schema.
  async findLatestVersion<
    K extends keyof NotificationTemplatePersistence = keyof NotificationTemplatePersistence,
  >(
    tenantId: string | null,
    key: string,
    channel: NotificationChannel,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationTemplatePersistence, K> | null> {
    void tenantId;
    const row = await this.templateQuery.findLatestVersion(key, channel, options);
    return row
      ? (NotificationConfigConverter.toTemplatePartialPersistence(row) as Pick<
          NotificationTemplatePersistence,
          K
        >)
      : null;
  }

  async findBySlug<
    K extends keyof NotificationTemplatePersistence = keyof NotificationTemplatePersistence,
  >(
    slug: string,
    tenantId: string | null,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationTemplatePersistence, K> | null> {
    void tenantId;
    const row = await this.templateQuery.findByKeyLatestActive(slug, options);
    return row
      ? (NotificationConfigConverter.toTemplatePartialPersistence(row) as Pick<
          NotificationTemplatePersistence,
          K
        >)
      : null;
  }

  async list<K extends keyof NotificationTemplatePersistence = keyof NotificationTemplatePersistence>(
    tenantId: string,
    options?: NotificationTemplatePersistenceQueryOptions<K>,
  ): Promise<Pick<NotificationTemplatePersistence, K>[]> {
    void tenantId;
    const rows = await this.templateQuery.list(options);
    return rows.map(
      (row) =>
        NotificationConfigConverter.toTemplatePartialPersistence(row) as Pick<
          NotificationTemplatePersistence,
          K
        >,
    );
  }

  async activate(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).notificationTemplate.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).notificationTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
