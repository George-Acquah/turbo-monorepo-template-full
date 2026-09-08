import { Inject, Injectable } from '@nestjs/common';
import {
  MEMBER_PROFILE_REPOSITORY_TOKEN,
  type MemberProfileRepositoryPort,
  CONSENT_RECORD_REPOSITORY_TOKEN,
  type ConsentRecordRepositoryPort,
  type ConsentRecordPersistence,
  EVENT_PUBLISHER_TOKEN,
  type EventPublisherPort,
  TRANSACTION_PORT_TOKEN,
  type TransactionPort,
  type DatabaseTx,
} from '@workspace/ports';
import { AggregateType, ProfileErrorCodes } from '@workspace/constants';
import { ProfilesEvents } from '@workspace/types';
import { NotFoundAppException } from '@workspace/utils';
import type { RecordConsentInput } from '../dto/consent.dto';

@Injectable()
export class WithdrawConsentUseCase {
  constructor(
    @Inject(MEMBER_PROFILE_REPOSITORY_TOKEN)
    private readonly memberProfileRepo: MemberProfileRepositoryPort,
    @Inject(CONSENT_RECORD_REPOSITORY_TOKEN)
    private readonly consentRepo: ConsentRecordRepositoryPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(userId: string, input: RecordConsentInput): Promise<ConsentRecordPersistence> {
    const profile = await this.memberProfileRepo.findByUserId(userId, { select: ['id'] });
    if (!profile) {
      throw new NotFoundAppException(
        ProfileErrorCodes.PROFILE_NOT_FOUND,
        'No member profile is linked to this account yet',
      );
    }

    return this.transactionPort.execute(async (tx) => {
      const record = await this.consentRepo.create(
        {
          profileId: profile.id,
          kind: input.kind,
          version: input.version,
          granted: false,
          ipAddress: input.ipAddress ?? null,
        },
        tx as DatabaseTx,
      );

      await this.publisher.publishWithTransaction(tx, {
        eventType: ProfilesEvents.CONSENT_WITHDRAWN,
        aggregateType: AggregateType.CONSENT_RECORD,
        aggregateId: record.id,
        userId,
        payload: {
          profileId: profile.id,
          userId,
          kind: input.kind,
          version: input.version,
        },
      });

      return record;
    });
  }
}
