import { Inject, Injectable } from '@nestjs/common';
import {
  API_KEY_REPOSITORY_TOKEN,
  type ApiKeyRepositoryPort,
  EVENT_PUBLISHER_TOKEN,
  type EventPublisherPort,
  TRANSACTION_PORT_TOKEN,
  type TransactionPort,
  type DatabaseTx,
} from '@workspace/ports';
import { AggregateType, IdentityErrorCodes } from '@workspace/constants';
import { IdentityEvents } from '@workspace/types';
import { NotFoundAppException } from '@workspace/utils';

@Injectable()
export class RevokeApiKeyUseCase {
  constructor(
    @Inject(API_KEY_REPOSITORY_TOKEN) private readonly apiKeyRepo: ApiKeyRepositoryPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.apiKeyRepo.findById(id, { select: ['id', 'apiClientId'] });
    if (!existing) {
      throw new NotFoundAppException(IdentityErrorCodes.IDENTITY_API_KEY_NOT_FOUND, `API key "${id}" not found`);
    }

    await this.transactionPort.execute(async (tx) => {
      await this.apiKeyRepo.revoke(id, tx as DatabaseTx);

      await this.publisher.publishWithTransaction(tx, {
        eventType: IdentityEvents.API_KEY_REVOKED,
        aggregateType: AggregateType.API_KEY,
        aggregateId: id,
        payload: {
          apiKeyId: id,
          apiClientId: existing.apiClientId,
        },
      });
    });
  }
}
