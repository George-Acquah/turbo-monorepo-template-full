import { Inject, Injectable } from '@nestjs/common';
import {
  API_KEY_REPOSITORY_TOKEN,
  type ApiKeyRepositoryPort,
  API_CLIENT_REPOSITORY_TOKEN,
  type ApiClientRepositoryPort,
  HASH_PORT_TOKEN,
  type HashPort,
  EVENT_PUBLISHER_TOKEN,
  type EventPublisherPort,
  TRANSACTION_PORT_TOKEN,
  type TransactionPort,
  type DatabaseTx,
} from '@workspace/ports';
import { AggregateType, ApiClientStatus, IdentityErrorCodes, IdPrefixes } from '@workspace/constants';
import { IdentityEvents } from '@workspace/types';
import { BadRequestAppException, NotFoundAppException, createIdentifier } from '@workspace/utils';
import type { CreateApiKeyUseCaseInput, CreatedApiKey } from '../dto/api-key.dto';

const ApiKeyId = createIdentifier(IdPrefixes.API_KEY);
const KEY_PREFIX_LENGTH = 10;

@Injectable()
export class CreateApiKeyUseCase {
  constructor(
    @Inject(API_KEY_REPOSITORY_TOKEN) private readonly apiKeyRepo: ApiKeyRepositoryPort,
    @Inject(API_CLIENT_REPOSITORY_TOKEN) private readonly apiClientRepo: ApiClientRepositoryPort,
    @Inject(HASH_PORT_TOKEN) private readonly hashPort: HashPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(input: CreateApiKeyUseCaseInput): Promise<CreatedApiKey> {
    const apiClient = await this.apiClientRepo.findById(input.apiClientId, {
      select: ['id', 'status'],
    });
    if (!apiClient) {
      throw new NotFoundAppException(
        IdentityErrorCodes.IDENTITY_API_CLIENT_NOT_FOUND,
        `API client "${input.apiClientId}" not found`,
      );
    }
    if (apiClient.status !== ApiClientStatus.ACTIVE) {
      throw new BadRequestAppException(
        IdentityErrorCodes.IDENTITY_API_CLIENT_NOT_ACTIVE,
        `API client "${input.apiClientId}" is not active (status: ${apiClient.status})`,
      );
    }

    const rawKey = await this.hashPort.generateSecureToken();
    const keyPrefix = rawKey.slice(0, KEY_PREFIX_LENGTH);
    const keyHash = await this.hashPort.hashToken(rawKey);
    const id = ApiKeyId.generate();

    const created = await this.transactionPort.execute(async (tx) => {
      const apiKey = await this.apiKeyRepo.create(
        {
          id,
          apiClientId: input.apiClientId,
          name: input.name,
          keyPrefix,
          keyHash,
          scopes: input.scopes,
          expiresAt: input.expiresAt ?? null,
        },
        tx as DatabaseTx,
      );

      await this.publisher.publishWithTransaction(tx, {
        eventType: IdentityEvents.API_KEY_CREATED,
        aggregateType: AggregateType.API_KEY,
        aggregateId: apiKey.id,
        payload: {
          apiKeyId: apiKey.id,
          apiClientId: apiKey.apiClientId,
          name: apiKey.name,
          scopes: apiKey.scopes,
        },
      });

      return apiKey;
    });

    return {
      id: created.id,
      apiClientId: created.apiClientId,
      name: created.name,
      keyPrefix: created.keyPrefix,
      scopes: created.scopes,
      apiKey: rawKey,
    };
  }
}
