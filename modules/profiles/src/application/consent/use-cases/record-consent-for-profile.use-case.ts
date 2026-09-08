import { Inject, Injectable } from '@nestjs/common';
import {
  CONSENT_RECORD_REPOSITORY_TOKEN,
  type ConsentRecordRepositoryPort,
  type ConsentRecordPersistence,
  EVENT_PUBLISHER_TOKEN,
  type EventPublisherPort,
  TRANSACTION_PORT_TOKEN,
  type TransactionPort,
  type DatabaseTx,
} from '@workspace/ports';
import { AggregateType } from '@workspace/constants';
import { ProfilesEvents } from '@workspace/types';
import type { RecordConsentForProfileInput } from '../dto/consent.dto';

/**
 * `profileId`-keyed sibling of `RecordConsentUseCase` (which requires a
 * claimed `userId`). Guest-checkout profiles don't have a `userId` yet, so
 * this is what `ProfilesApplicationPort.recordConsent` delegates to for
 * `modules/enrolments`' create-enrolment flow (terms-of-service consent at
 * signup, before any account exists).
 */
@Injectable()
export class RecordConsentForProfileUseCase {
  constructor(
    @Inject(CONSENT_RECORD_REPOSITORY_TOKEN)
    private readonly consentRepo: ConsentRecordRepositoryPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(
    input: RecordConsentForProfileInput,
    tx?: DatabaseTx,
  ): Promise<ConsentRecordPersistence> {
    const run = async (activeTx: DatabaseTx) => {
      const record = await this.consentRepo.create(
        {
          profileId: input.profileId,
          kind: input.kind,
          version: input.version,
          granted: input.granted,
          ipAddress: input.ipAddress ?? null,
        },
        activeTx,
      );

      await this.publisher.publishWithTransaction(activeTx, {
        eventType: ProfilesEvents.CONSENT_GRANTED,
        aggregateType: AggregateType.CONSENT_RECORD,
        aggregateId: record.id,
        payload: {
          profileId: input.profileId,
          kind: input.kind,
          version: input.version,
        },
      });

      return record;
    };

    // input.profileId is threaded as an explicit RLS override on the no-tx
    // branch so app.profile_id is set for this write — see
    // docs/infrastructure/runbooks/db-rls-policies.sql's v5 entry. When a
    // `tx` is passed in, the caller's own transactionPort.execute() call
    // already set it for the whole enclosing transaction.
    return tx
      ? run(tx)
      : this.transactionPort.execute((t) => run(t as DatabaseTx), {
          profileId: input.profileId,
        });
  }
}
