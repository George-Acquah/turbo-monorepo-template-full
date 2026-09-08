import { DatabaseTx } from '../shared';
import {
  PendingInvitationPersistence,
  CreatePendingInvitationInput,
  PendingInvitationPersistenceQueryOptions,
} from './auth.types';

export abstract class PendingInvitationRepositoryPort {
  abstract create(
    data: CreatePendingInvitationInput,
    tx?: DatabaseTx,
  ): Promise<PendingInvitationPersistence>;

  abstract markAccepted(
    id: string,
    acceptedUserId: string,
    tx?: DatabaseTx,
  ): Promise<PendingInvitationPersistence>;

  abstract markCancelled(id: string, tx?: DatabaseTx): Promise<PendingInvitationPersistence>;

  //Reads
  abstract findById<
    K extends keyof PendingInvitationPersistence = keyof PendingInvitationPersistence,
  >(
    id: string,
    options?: PendingInvitationPersistenceQueryOptions<K>,
  ): Promise<Pick<PendingInvitationPersistence, K> | null>;

  abstract findByToken<
    K extends keyof PendingInvitationPersistence = keyof PendingInvitationPersistence,
  >(
    verificationToken: string,
    options?: PendingInvitationPersistenceQueryOptions<K>,
  ): Promise<Pick<PendingInvitationPersistence, K> | null>;

  /**
   * Finds still-PENDING invitations for a recipient — used to prevent
   * duplicate invites to the same email/phone.
   */
  abstract findPendingForRecipient<
    K extends keyof PendingInvitationPersistence = keyof PendingInvitationPersistence,
  >(
    recipient: { email?: string; phone?: string },
    options?: PendingInvitationPersistenceQueryOptions<K>,
  ): Promise<Pick<PendingInvitationPersistence, K>[]>;

  /**
   * Marks all overdue PENDING invitations as EXPIRED. Returns the count updated.
   */
  abstract expireOverdue(tx?: DatabaseTx): Promise<number>;
}

export const PENDING_INVITATION_REPOSITORY_TOKEN = Symbol('PENDING_INVITATION_REPOSITORY_TOKEN');
export const PRISMA_PENDING_INVITATION_REPOSITORY_TOKEN = Symbol(
  'PRISMA_PENDING_INVITATION_REPOSITORY_TOKEN',
);
