import { Inject, Injectable } from '@nestjs/common';
import {
  API_CLIENT_REPOSITORY_TOKEN,
  type ApiClientRepositoryPort,
  HASH_PORT_TOKEN,
  type HashPort,
  TOKEN_PORT_TOKEN,
  TokenPort,
} from '@workspace/ports';
import { IdPrefixes } from '@workspace/constants';
import { createIdentifier } from '@workspace/utils';
import type { CreateApiClientUseCaseInput, CreatedApiClient } from '../dto/api-client.dto';

const ApiClientId = createIdentifier(IdPrefixes.API_CLIENT);

@Injectable()
export class CreateApiClientUseCase {
  constructor(
    @Inject(API_CLIENT_REPOSITORY_TOKEN) private readonly apiClientRepo: ApiClientRepositoryPort,
    @Inject(HASH_PORT_TOKEN) private readonly hashPort: HashPort,
    @Inject(TOKEN_PORT_TOKEN) private readonly tokenPort: TokenPort,
  ) {}

  async execute(input: CreateApiClientUseCaseInput): Promise<CreatedApiClient> {
    const clientSecret = await this.hashPort.generateSecureToken();
    const clientSecretHash = await this.hashPort.hashToken(clientSecret);

    const created = await this.apiClientRepo.create({
      id: ApiClientId.generate(),
      name: input.name,
      description: input.description ?? null,
      clientId: ApiClientId.generate(),
      clientSecretHash,
      createdByUserId: input.createdByUserId ?? null,
      metadata: input.metadata ?? null,
    });

    return {
      id: created.id,
      clientId: created.clientId,
      clientSecret,
      name: created.name,
    };
  }
}
