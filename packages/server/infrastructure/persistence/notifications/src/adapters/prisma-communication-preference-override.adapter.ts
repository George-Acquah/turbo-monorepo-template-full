import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  CommunicationPreferenceOverrideRepositoryPort,
  type CommunicationPreferenceOverridePersistence,
  type CreateCommunicationPreferenceOverrideInput,
  type CommunicationPreferenceOverridePersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { NotificationConfigConverter } from '../converter/notification-config.converter';
import { CommunicationPreferenceOverrideQuery } from '../queries/communication-preference-override.query';

@Injectable()
export class PrismaCommunicationPreferenceOverrideAdapter
  implements CommunicationPreferenceOverrideRepositoryPort
{
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly overrideQuery: CommunicationPreferenceOverrideQuery,
  ) {}

  async create<
    K extends keyof CommunicationPreferenceOverridePersistence = keyof CommunicationPreferenceOverridePersistence,
  >(
    data: CreateCommunicationPreferenceOverrideInput,
    tx?: DatabaseTx,
  ): Promise<Pick<CommunicationPreferenceOverridePersistence, K>> {
    const row = await resolvePrismaClient(tx, this.prisma).communicationPreferenceOverride.create({
      data: { id: generateId(IdPrefixes.COMMUNICATION_OVERRIDE), ...data },
    });
    return NotificationConfigConverter.toOverridePersistence(row) as Pick<
      CommunicationPreferenceOverridePersistence,
      K
    >;
  }

  async findActiveOverrides<
    K extends keyof CommunicationPreferenceOverridePersistence = keyof CommunicationPreferenceOverridePersistence,
  >(
    category: string,
    tx?: DatabaseTx,
    options?: CommunicationPreferenceOverridePersistenceQueryOptions<K>,
  ): Promise<Pick<CommunicationPreferenceOverridePersistence, K>[]> {
    const rows = await this.overrideQuery.findActiveOverrides(category, { ...options, tx });
    return rows.map(
      (row) =>
        NotificationConfigConverter.toOverridePartialPersistence(row) as Pick<
          CommunicationPreferenceOverridePersistence,
          K
        >,
    );
  }

  // No status field on this model — "expire" means setting expiresAt to now,
  // which findActiveOverrides' (expiresAt IS NULL OR expiresAt > now) filter
  // then excludes.
  async expire(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).communicationPreferenceOverride.update({
      where: { id },
      data: { expiresAt: new Date() },
    });
  }
}
