import { Inject, Injectable } from '@nestjs/common';
import {
  API_CLIENT_REPOSITORY_TOKEN,
  type ApiClientRepositoryPort,
  type ApiClientPersistence,
} from '@workspace/ports';

@Injectable()
export class ListApiClientsUseCase {
  constructor(
    @Inject(API_CLIENT_REPOSITORY_TOKEN) private readonly apiClientRepo: ApiClientRepositoryPort,
  ) {}

  async execute(): Promise<ApiClientPersistence[]> {
    return this.apiClientRepo.findMany();
  }
}
