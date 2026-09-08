import { DatabaseTx } from '../shared';
import {
  ApiClientPersistence,
  ApiClientPersistenceQueryOptions,
  CreateApiClientInput,
  UpdateApiClientInput,
} from './identity.types';

export abstract class ApiClientRepositoryPort {
  //Writes
  abstract create(data: CreateApiClientInput, tx?: DatabaseTx): Promise<ApiClientPersistence>;

  abstract update(
    id: string,
    data: UpdateApiClientInput,
    tx?: DatabaseTx,
  ): Promise<ApiClientPersistence>;

  abstract softDelete(id: string, tx?: DatabaseTx): Promise<void>;

  //Reads

  abstract findById<K extends keyof ApiClientPersistence = keyof ApiClientPersistence>(
    id: string,
    options?: ApiClientPersistenceQueryOptions<K>,
  ): Promise<Pick<ApiClientPersistence, K> | null>;

  abstract findByClientId<K extends keyof ApiClientPersistence = keyof ApiClientPersistence>(
    clientId: string,
    options?: ApiClientPersistenceQueryOptions<K>,
  ): Promise<Pick<ApiClientPersistence, K> | null>;

  abstract findMany<K extends keyof ApiClientPersistence = keyof ApiClientPersistence>(
    options?: ApiClientPersistenceQueryOptions<K>,
  ): Promise<Pick<ApiClientPersistence, K>[]>;
}

export const API_CLIENT_REPOSITORY_TOKEN = Symbol('API_CLIENT_REPOSITORY_TOKEN');
export const PRISMA_API_CLIENT_REPOSITORY_TOKEN = Symbol('PRISMA_API_CLIENT_REPOSITORY_TOKEN');
