import { Inject, Injectable } from '@nestjs/common';
import type { MemberProfilePersistence, MemberProfilePersistenceQueryOptions } from '@workspace/ports';
import {
  PrismaService,
  PRISMA_CLIENT_TOKEN,
  resolvePrismaClient,
  buildPrismaSelect,
} from '@workspace/prisma';
import type { MemberProfile as PrismaMemberProfile } from '@workspace/prisma/client';

type MemberProfileRow = Partial<PrismaMemberProfile>;

@Injectable()
export class MemberProfileQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof MemberProfilePersistence = keyof MemberProfilePersistence>(
    id: string,
    options?: MemberProfilePersistenceQueryOptions<K>,
  ): Promise<MemberProfileRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).memberProfile.findUnique({
      where: { id },
      select: buildPrismaSelect<MemberProfilePersistence, K>(options?.select),
    });
  }

  findByEmail<K extends keyof MemberProfilePersistence = keyof MemberProfilePersistence>(
    email: string,
    options?: MemberProfilePersistenceQueryOptions<K>,
  ): Promise<MemberProfileRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).memberProfile.findUnique({
      where: { email },
      select: buildPrismaSelect<MemberProfilePersistence, K>(options?.select),
    });
  }

  findByUserId<K extends keyof MemberProfilePersistence = keyof MemberProfilePersistence>(
    userId: string,
    options?: MemberProfilePersistenceQueryOptions<K>,
  ): Promise<MemberProfileRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).memberProfile.findUnique({
      where: { userId },
      select: buildPrismaSelect<MemberProfilePersistence, K>(options?.select),
    });
  }

  listActive(input: { afterId?: string; limit: number }): Promise<Array<Pick<MemberProfileRow, 'id' | 'userId'>>> {
    return this.prisma.memberProfile.findMany({
      where: {
        deletedAt: null,
        ...(input.afterId ? { id: { gt: input.afterId } } : {}),
      },
      orderBy: { id: 'asc' },
      take: input.limit,
      select: { id: true, userId: true },
    });
  }
}
