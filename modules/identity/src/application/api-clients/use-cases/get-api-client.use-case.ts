import { Inject, Injectable } from '@nestjs/common';
import {
  API_CLIENT_REPOSITORY_TOKEN,
  type ApiClientRepositoryPort,
  type ApiClientPersistence,
} from '@workspace/ports';
import { IdentityErrorCodes } from '@workspace/constants';
import { NotFoundAppException } from '@workspace/utils';

@Injectable()
export class GetApiClientUseCase {
  constructor(
    @Inject(API_CLIENT_REPOSITORY_TOKEN) private readonly apiClientRepo: ApiClientRepositoryPort,
  ) {}

  async execute(id: string): Promise<ApiClientPersistence> {
    const apiClient = await this.apiClientRepo.findById(id);
    if (!apiClient) {
      throw new NotFoundAppException(
        IdentityErrorCodes.IDENTITY_API_CLIENT_NOT_FOUND,
        `API client "${id}" not found`,
      );
    }
    return apiClient;
  }
}
