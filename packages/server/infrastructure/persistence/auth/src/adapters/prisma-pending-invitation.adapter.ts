import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes, InvitationStatus } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  PendingInvitationRepositoryPort,
  type PendingInvitationPersistence,
  type CreatePendingInvitationInput,
  type PendingInvitationPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { InvitationQuery } from '../queries/invitation.query';

// Not part of the original scaffold — PendingInvitationRepositoryPort didn't
// exist yet either (added this session to match the scaffolded
// queries/invitation.query.ts, which implied a PendingInvitation adapter
// belongs in this package).
@Injectable()
export class PrismaPendingInvitationAdapter implements PendingInvitationRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly invitationQuery: InvitationQuery,
  ) {}

  create(
    data: CreatePendingInvitationInput,
    tx?: DatabaseTx,
  ): Promise<PendingInvitationPersistence> {
    const { id, status, ...rest } = data;
    return resolvePrismaClient(tx, this.prisma).pendingInvitation.create({
      data: {
        id: id ?? generateId(IdPrefixes.PENDING_INVITATION),
        status: status ?? InvitationStatus.PENDING,
        ...rest,
      },
    });
  }

  markAccepted(
    id: string,
    acceptedUserId: string,
    tx?: DatabaseTx,
  ): Promise<PendingInvitationPersistence> {
    return resolvePrismaClient(tx, this.prisma).pendingInvitation.update({
      where: { id },
      data: { status: InvitationStatus.ACCEPTED, acceptedUserId, acceptedAt: new Date() },
    });
  }

  markCancelled(id: string, tx?: DatabaseTx): Promise<PendingInvitationPersistence> {
    return resolvePrismaClient(tx, this.prisma).pendingInvitation.update({
      where: { id },
      data: { status: InvitationStatus.CANCELLED },
    });
  }

  //Reads

  findById<K extends keyof PendingInvitationPersistence = keyof PendingInvitationPersistence>(
    id: string,
    options?: PendingInvitationPersistenceQueryOptions<K>,
  ): Promise<Pick<PendingInvitationPersistence, K> | null> {
    return this.invitationQuery.findById(id, options) as Promise<
      Pick<PendingInvitationPersistence, K> | null
    >;
  }

  findByToken<K extends keyof PendingInvitationPersistence = keyof PendingInvitationPersistence>(
    verificationToken: string,
    options?: PendingInvitationPersistenceQueryOptions<K>,
  ): Promise<Pick<PendingInvitationPersistence, K> | null> {
    return this.invitationQuery.findByToken(verificationToken, options) as Promise<
      Pick<PendingInvitationPersistence, K> | null
    >;
  }

  findPendingForRecipient<
    K extends keyof PendingInvitationPersistence = keyof PendingInvitationPersistence,
  >(
    recipient: { email?: string; phone?: string },
    options?: PendingInvitationPersistenceQueryOptions<K>,
  ): Promise<Pick<PendingInvitationPersistence, K>[]> {
    return this.invitationQuery.findPendingForRecipient(recipient, options) as Promise<
      Pick<PendingInvitationPersistence, K>[]
    >;
  }

  async expireOverdue(tx?: DatabaseTx): Promise<number> {
    const result = await resolvePrismaClient(tx, this.prisma).pendingInvitation.updateMany({
      where: { status: InvitationStatus.PENDING, expiresAt: { lt: new Date() } },
      data: { status: InvitationStatus.EXPIRED },
    });
    return result.count;
  }
}
