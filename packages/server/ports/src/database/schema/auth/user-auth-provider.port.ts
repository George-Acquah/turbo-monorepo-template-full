import { AuthProvider } from '@workspace/constants';
import { DatabaseTx } from '../shared';
import {
  UserAuthProviderPersistence,
  CreateUserAuthProviderInput,
  UpdateUserAuthProviderInput,
  UserAuthProviderPersistenceQueryOptions,
} from './auth.types';

export abstract class UserAuthProviderRepositoryPort {
  abstract create(
    data: CreateUserAuthProviderInput,
    tx?: DatabaseTx,
  ): Promise<UserAuthProviderPersistence>;

  abstract update(
    id: string,
    data: UpdateUserAuthProviderInput,
    tx?: DatabaseTx,
  ): Promise<UserAuthProviderPersistence>;

  abstract delete(id: string, tx?: DatabaseTx): Promise<void>;

  //Reads
  abstract findById<
    K extends keyof UserAuthProviderPersistence = keyof UserAuthProviderPersistence,
  >(
    id: string,
    options?: UserAuthProviderPersistenceQueryOptions<K>,
  ): Promise<Pick<UserAuthProviderPersistence, K> | null>;

  /**
   * Finds a provider link by the external provider's unique ID (e.g. Google Sub ID).
   */
  abstract findByProviderId<
    K extends keyof UserAuthProviderPersistence = keyof UserAuthProviderPersistence,
  >(
    provider: AuthProvider,
    providerId: string,
    options?: UserAuthProviderPersistenceQueryOptions<K>,
  ): Promise<Pick<UserAuthProviderPersistence, K> | null>;

  /**
   * Fetches all federated links for a specific user.
   */
  abstract findByUserId<
    K extends keyof UserAuthProviderPersistence = keyof UserAuthProviderPersistence,
  >(
    userId: string,
    options?: UserAuthProviderPersistenceQueryOptions<K>,
  ): Promise<Pick<UserAuthProviderPersistence, K>[]>;
}

export const USER_AUTH_PROVIDER_REPOSITORY_TOKEN = Symbol('USER_AUTH_PROVIDER_REPOSITORY_TOKEN');
export const PRISMA_USER_AUTH_PROVIDER_REPOSITORY_TOKEN = Symbol(
  'PRISMA_USER_AUTH_PROVIDER_REPOSITORY_TOKEN',
);
