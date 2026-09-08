import { Inject, Injectable } from '@nestjs/common';
import {
  API_KEY_REPOSITORY_TOKEN,
  type ApiKeyRepositoryPort,
  type ApiKeyPersistence,
} from '@workspace/ports';

@Injectable()
export class ListClientKeysUseCase {
  constructor(
    @Inject(API_KEY_REPOSITORY_TOKEN) private readonly apiKeyRepo: ApiKeyRepositoryPort,
  ) {}

  async execute(apiClientId: string): Promise<Omit<ApiKeyPersistence, 'keyHash'>[]> {
    // keyHash is never returned to any presentation layer, even internally —
    // select it out at the source rather than relying on every DTO to
    // remember to omit it.
    return this.apiKeyRepo.findClientKeys(apiClientId, {
      select: [
        'id',
        'apiClientId',
        'name',
        'keyPrefix',
        'status',
        'scopes',
        'expiresAt',
        'lastUsedAt',
        'revokedAt',
        'createdAt',
      ],
    });
  }
}
