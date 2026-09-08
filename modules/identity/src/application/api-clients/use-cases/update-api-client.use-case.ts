import { Inject, Injectable } from '@nestjs/common';
import {
  API_CLIENT_REPOSITORY_TOKEN,
  type ApiClientRepositoryPort,
  type ApiClientPersistence,
} from '@workspace/ports';
import { IdentityErrorCodes } from '@workspace/constants';
import { NotFoundAppException } from '@workspace/utils';
import type { UpdateApiClientUseCaseInput } from '../dto/api-client.dto';

@Injectable()
export class UpdateApiClientUseCase {
  constructor(
    @Inject(API_CLIENT_REPOSITORY_TOKEN) private readonly apiClientRepo: ApiClientRepositoryPort,
  ) {}

  async execute(id: string, input: UpdateApiClientUseCaseInput): Promise<ApiClientPersistence> {
    const existing = await this.apiClientRepo.findById(id, { select: ['id'] });
    if (!existing) {
      throw new NotFoundAppException(
        IdentityErrorCodes.IDENTITY_API_CLIENT_NOT_FOUND,
        `API client "${id}" not found`,
      );
    }

    return this.apiClientRepo.update(id, input);
  }
}
