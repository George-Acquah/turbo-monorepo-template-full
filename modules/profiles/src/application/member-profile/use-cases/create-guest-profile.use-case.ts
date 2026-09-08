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
import type { CreateGuestProfileInput } from '../dto/member-profile.dto';

const ProfileId = createIdentifier(IdPrefixes.PROFILE);

/**
 * Guest-checkout entry point: a profile can exist before any User does (doc
 * 06 §2/§5). Internal application service, not wired to an HTTP endpoint yet
 * — nothing calls it today since `modules/enrolments` (the real trigger,
 * "guest enrols without an account") doesn't exist. Built and tested
 * directly so the real caller (the enrolment activation saga) can just call
 * it once that module exists, with no rework needed here.
 *
 * Idempotent on email — a guest re-enrolling before claiming their first
 * profile must not fork into two profiles.
 *
 * Accepts an optional external `tx` so a caller already inside its own
 * business transaction (e.g. `modules/enrolments`' create-enrolment flow, via
 * `ProfilesApplicationPort.findOrCreateProfileByEmail`) can enlist this write
 * in the same transaction instead of committing separately. Opens its own
 * transaction when called without one (e.g. a future direct HTTP caller).
 */
@Injectable()
export class CreateGuestProfileUseCase {
  constructor(
    @Inject(MEMBER_PROFILE_REPOSITORY_TOKEN)
    private readonly memberProfileRepo: MemberProfileRepositoryPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(
    input: CreateGuestProfileInput,
    tx?: DatabaseTx,
  ): Promise<MemberProfilePersistence> {
    const existing = await this.memberProfileRepo.findByEmail(input.email);
    if (existing) {
      return existing;
    }

    const run = async (activeTx: DatabaseTx) => {
      const created = await this.memberProfileRepo.create(
        {
          id: ProfileId.generate(),
          userId: null,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone ?? null,
          country: input.country ?? 'GH',
          experience: input.experience ?? null,
          goal: input.goal ?? null,
          source: input.source ?? null,
          marketingOptIn: input.marketingOptIn ?? false,
          metadata: null,
        },
        activeTx,
      );

      await this.publisher.publishWithTransaction(activeTx, {
        eventType: ProfilesEvents.PROFILE_CREATED,
        aggregateType: AggregateType.PROFILE,
        aggregateId: created.id,
        payload: {
          profileId: created.id,
          email: created.email,
          source: input.source ?? undefined,
        },
      });

      return created;
    };

    return tx ? run(tx) : this.transactionPort.execute((t) => run(t as DatabaseTx));
  }
}
