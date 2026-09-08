import { Inject, Injectable } from '@nestjs/common';
import type {
  PendingInvitationPersistence,
  PendingInvitationPersistenceQueryOptions,
} from '@workspace/ports';
import {
  PrismaService,
  PRISMA_CLIENT_TOKEN,
  resolvePrismaClient,
  buildPrismaSelect,
} from '@workspace/prisma';
import type { PendingInvitation as PrismaPendingInvitation } from '@workspace/prisma/client';
import { InvitationStatus } from '@workspace/constants';

type InvitationRow = Partial<PrismaPendingInvitation>;

@Injectable()
export class InvitationQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof PendingInvitationPersistence = keyof PendingInvitationPersistence>(
    id: string,
    options?: PendingInvitationPersistenceQueryOptions<K>,
  ): Promise<InvitationRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).pendingInvitation.findUnique({
      where: { id },
      select: buildPrismaSelect<PendingInvitationPersistence, K>(options?.select),
    });
  }

  findByToken<K extends keyof PendingInvitationPersistence = keyof PendingInvitationPersistence>(
    verificationToken: string,
    options?: PendingInvitationPersistenceQueryOptions<K>,
  ): Promise<InvitationRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).pendingInvitation.findUnique({
      where: { verificationToken },
      select: buildPrismaSelect<PendingInvitationPersistence, K>(options?.select),
    });
  }

  findPendingForRecipient<
    K extends keyof PendingInvitationPersistence = keyof PendingInvitationPersistence,
  >(
    recipient: { email?: string; phone?: string },
    options?: PendingInvitationPersistenceQueryOptions<K>,
  ): Promise<InvitationRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).pendingInvitation.findMany({
      where: {
        status: InvitationStatus.PENDING,
        OR: [
          ...(recipient.email ? [{ email: recipient.email }] : []),
          ...(recipient.phone ? [{ phone: recipient.phone }] : []),
        ],
      },
      select: buildPrismaSelect<PendingInvitationPersistence, K>(options?.select),
    });
  }
}
