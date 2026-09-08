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
import type { UpdateMyProfileInput } from '../dto/member-profile.dto';

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(
    @Inject(MEMBER_PROFILE_REPOSITORY_TOKEN)
    private readonly memberProfileRepo: MemberProfileRepositoryPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(userId: string, input: UpdateMyProfileInput): Promise<MemberProfilePersistence> {
    const existing = await this.memberProfileRepo.findByUserId(userId, { select: ['id'] });
    if (!existing) {
      throw new NotFoundAppException(
        ProfileErrorCodes.PROFILE_NOT_FOUND,
        'No member profile is linked to this account yet',
      );
    }

    return this.transactionPort.execute(async (tx) => {
      const updated = await this.memberProfileRepo.update(existing.id, input, tx as DatabaseTx);

      await this.publisher.publishWithTransaction(tx, {
        eventType: ProfilesEvents.PROFILE_UPDATED,
        aggregateType: AggregateType.PROFILE,
        aggregateId: updated.id,
        userId,
        payload: {
          profileId: updated.id,
          userId,
          changes: { ...input } as Record<string, unknown>,
        },
      });

      return updated;
    });
  }
}
