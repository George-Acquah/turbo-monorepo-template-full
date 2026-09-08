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
import { AggregateType, ProfileErrorCodes } from '@workspace/constants';
import { ProfilesEvents } from '@workspace/types';
import { NotFoundAppException } from '@workspace/utils';

/** ISO timestamp of first-run onboarding completion, stashed on the profile. */
export const ONBOARDED_AT_METADATA_KEY = 'onboardedAt';

export function profileOnboardedAt(
  profile: Pick<MemberProfilePersistence, 'metadata'>,
): string | null {
  const value = profile.metadata?.[ONBOARDED_AT_METADATA_KEY];
  return typeof value === 'string' ? value : null;
}

/**
 * `POST /v1/account/complete-onboarding` — marks the first-run onboarding
 * flow (apps/members `/welcome`) done. Idempotent: stamps
 * `metadata.onboardedAt` once and never re-stamps it, so a replayed request
 * (double-submit, a member revisiting `/welcome`) is a harmless no-op that
 * still returns the profile.
 *
 * Stored in `metadata` rather than a dedicated column: the Prisma 8 RC
 * migrate tooling is currently unusable in this environment, and a
 * write-once ISO string is exactly what the JSON bag is for.
 */
@Injectable()
export class CompleteOnboardingUseCase {
  constructor(
    @Inject(MEMBER_PROFILE_REPOSITORY_TOKEN)
    private readonly memberProfileRepo: MemberProfileRepositoryPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(userId: string): Promise<MemberProfilePersistence> {
    const existing = await this.memberProfileRepo.findByUserId(userId);
    if (!existing) {
      throw new NotFoundAppException(
        ProfileErrorCodes.PROFILE_NOT_FOUND,
        'No member profile is linked to this account yet',
      );
    }

    if (profileOnboardedAt(existing)) {
      return existing; // already onboarded — no write, no event
    }

    const onboardedAt = new Date().toISOString();
    const metadata = { ...(existing.metadata ?? {}), [ONBOARDED_AT_METADATA_KEY]: onboardedAt };

    return this.transactionPort.execute(async (tx) => {
      const updated = await this.memberProfileRepo.update(
        existing.id,
        { metadata },
        tx as DatabaseTx,
      );

      await this.publisher.publishWithTransaction(tx, {
        eventType: ProfilesEvents.PROFILE_UPDATED,
        aggregateType: AggregateType.PROFILE,
        aggregateId: updated.id,
        userId,
        payload: {
          profileId: updated.id,
          userId,
          changes: { onboardedAt },
        },
      });

      return updated;
    });
  }
}
