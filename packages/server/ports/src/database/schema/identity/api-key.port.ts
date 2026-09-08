import { DatabaseTx } from '../shared';
import {
  ApiKeyPersistence,
  ApiKeyPersistenceQueryOptions,
  CreateApiKeyInput,
} from './identity.types';

export abstract class ApiKeyRepositoryPort {
  //Writes
  abstract create(data: CreateApiKeyInput, tx?: DatabaseTx): Promise<ApiKeyPersistence>;

  /**
   * Revoke key access immediately.
   */
  abstract revoke(id: string, tx?: DatabaseTx): Promise<void>;

  /**
   * Safely records usage timestamps.
   */
  abstract updateLastUsed(id: string, tx?: DatabaseTx): Promise<void>;

  //Reads

  abstract findById<K extends keyof ApiKeyPersistence = keyof ApiKeyPersistence>(
    id: string,
    options?: ApiKeyPersistenceQueryOptions<K>,
  ): Promise<Pick<ApiKeyPersistence, K> | null>;

  /**
   * Authenticates an API client by matching the secure SHA-256 hash of the key.
   */
  abstract findByKeyHash<K extends keyof ApiKeyPersistence = keyof ApiKeyPersistence>(
    keyHash: string,
    options?: ApiKeyPersistenceQueryOptions<K>,
  ): Promise<Pick<ApiKeyPersistence, K> | null>;

  abstract findClientKeys<K extends keyof ApiKeyPersistence = keyof ApiKeyPersistence>(
    apiClientId: string,
    options?: ApiKeyPersistenceQueryOptions<K>,
  ): Promise<Pick<ApiKeyPersistence, K>[]>;
}

export const API_KEY_REPOSITORY_TOKEN = Symbol('API_KEY_REPOSITORY_TOKEN');
export const PRISMA_API_KEY_REPOSITORY_TOKEN = Symbol('PRISMA_API_KEY_REPOSITORY_TOKEN');
