import { Inject, Injectable } from '@nestjs/common';
import type {
  CommunicationPreferenceOverridePersistence,
  CommunicationPreferenceOverridePersistenceQueryOptions,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { CommunicationPreferenceOverride as PrismaOverrideModel } from '@workspace/prisma/client';

type OverrideRow = Partial<PrismaOverrideModel>;

@Injectable()
export class CommunicationPreferenceOverrideQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findActiveOverrides<K extends keyof CommunicationPreferenceOverridePersistence>(
    category: string,
    options?: CommunicationPreferenceOverridePersistenceQueryOptions<K>,
  ): Promise<OverrideRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).communicationPreferenceOverride.findMany({
      where: {
        category,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: buildPrismaSelect<CommunicationPreferenceOverridePersistence, K>(options?.select),
    });
  }
}
