import { Inject, Injectable } from '@nestjs/common';
import {
  API_CLIENT_REPOSITORY_TOKEN,
  type ApiClientRepositoryPort,
} from '@workspace/ports';
import { ApiClientStatus, IdentityErrorCodes } from '@workspace/constants';
import { NotFoundAppException } from '@workspace/utils';

@Injectable()
export class RevokeApiClientUseCase {
  constructor(
    @Inject(API_CLIENT_REPOSITORY_TOKEN) private readonly apiClientRepo: ApiClientRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.apiClientRepo.findById(id, { select: ['id'] });
    if (!existing) {
      throw new NotFoundAppException(
        IdentityErrorCodes.IDENTITY_API_CLIENT_NOT_FOUND,
        `API client "${id}" not found`,
      );
    }

    await this.apiClientRepo.update(id, { status: ApiClientStatus.REVOKED });
  }
}
