import { Inject, Injectable } from '@nestjs/common';
import {
  MEMBER_PROFILE_REPOSITORY_TOKEN,
  type MemberProfileRepositoryPort,
  type MemberProfilePersistence,
  EVENT_PUBLISHER_TOKEN,
  type EventPublisherPort,
  TRANSACTION_PORT_TOKEN,
  type TransactionPort,
  type DatabaseTx,
} from '@workspace/ports';
import { AggregateType, IdPrefixes } from '@workspace/constants';
import { ProfilesEvents } from '@workspace/types';
import { createIdentifier } from '@workspace/utils';
import type { EnsureMemberProfileForUserInput } from '../dto/member-profile.dto';

const ProfileId = createIdentifier(IdPrefixes.PROFILE);

/**
 * The find-or-create seam for "this authenticated user needs a MemberProfile
 * now" — unlike `CreateGuestProfileUseCase` (always `userId: null`, the
 * guest-checkout entry point), this always has a real `userId` in hand.
 * Covers three cases:
 *
 * 1. A profile already linked to this userId exists (idempotent — safe to
 *    call from an at-least-once event handler on retry/replay).
 * 2. A guest-checkout profile with a matching email exists but isn't linked
 *    yet (e.g. the guest later self-registered instead of using the claim
 *    link) — link it. Deliberately does NOT re-publish `PROFILE_LINKED`:
 *    that event already has a real consumer
 *    (`SendWelcomeNotificationOnProfileLinkedHandler`), and this path isn't
 *    the account-claim flow that event describes — re-emitting it here would
 *    double-send a welcome touch alongside the direct-registration welcome
 *    handler in `modules/notifications`.
 * 3. Neither exists — create a fresh profile for this user.
 *
 * Built for `modules/profiles`' own `CreateProfileOnUserRegisteredHandler`
 * (reacts to `AuthEvents.USER_REGISTERED`) and reused directly by
 * `modules/events`' `RegisterForEventUseCase` via
 * `ProfilesApplicationPort.ensureProfileForUser` — both close the same root
 * gap: direct self-registration never created a `MemberProfile`.
 */
@Injectable()
export class EnsureMemberProfileForUserUseCase {
  constructor(
    @Inject(MEMBER_PROFILE_REPOSITORY_TOKEN)
    private readonly memberProfileRepo: MemberProfileRepositoryPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(
    input: EnsureMemberProfileForUserInput,
    tx?: DatabaseTx,
  ): Promise<MemberProfilePersistence> {
    const existingByUserId = await this.memberProfileRepo.findByUserId(input.userId);
    if (existingByUserId) {
      return existingByUserId;
    }

    const existingByEmail = await this.memberProfileRepo.findByEmail(input.email);
    if (existingByEmail) {
      return this.memberProfileRepo.linkUser(existingByEmail.id, input.userId, tx);
    }

    const run = async (activeTx: DatabaseTx) => {
      const created = await this.memberProfileRepo.create(
        {
          id: ProfileId.generate(),
          userId: input.userId,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone ?? null,
          country: 'GH',
          experience: null,
          goal: null,
          source: null,
          marketingOptIn: false,
          metadata: null,
        },
        activeTx,
      );

      await this.publisher.publishWithTransaction(activeTx, {
        eventType: ProfilesEvents.PROFILE_CREATED,
        aggregateType: AggregateType.PROFILE,
        aggregateId: created.id,
        userId: created.userId ?? undefined,
        payload: {
          profileId: created.id,
          userId: created.userId ?? undefined,
          email: created.email,
        },
      });

      return created;
    };

    return tx ? run(tx) : this.transactionPort.execute((t) => run(t as DatabaseTx));
  }
}
