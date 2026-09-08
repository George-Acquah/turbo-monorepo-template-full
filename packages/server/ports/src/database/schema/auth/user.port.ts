import { DatabaseTx } from '../shared';
import {
  UserPersistence,
  CreateUserInput,
  UpdateUserProfileInput,
  UpdateUserSecurityInput,
  UserPersistenceQueryOptions,
} from './auth.types';

export abstract class UserRepositoryPort {
  abstract create(data: CreateUserInput, tx?: DatabaseTx): Promise<UserPersistence>;

  /**
   * General profile updates (names, avatar, metadata)
   */
  abstract updateProfile(
    id: string,
    data: UpdateUserProfileInput,
    tx?: DatabaseTx,
  ): Promise<UserPersistence>;

  /**
   * Security/Auth specific updates (status, locks, password hashes, logins)
   */
  abstract updateSecurity(
    id: string,
    data: UpdateUserSecurityInput,
    tx?: DatabaseTx,
  ): Promise<UserPersistence>;

  /**
   * Atomically increments the failed login count and locks the account if threshold exceeded.
   * @param id - User ID
@param lockUntil - Optional explicit date to lock the account until. Calculated by the domain service.
   * @param tx - Optional database transaction
   * @returns The new failed login count.
   */
  abstract incrementFailedLogins(id: string, lockUntil?: Date, tx?: DatabaseTx): Promise<number>;

  /**
   * Atomically resets failed login counts upon successful authentication.
   */
  abstract resetFailedLogins(
    id: string,
    lastLoginIp?: string,
    lastLoginAt?: Date,
    tx?: DatabaseTx,
  ): Promise<UserPersistence>;

  /**
   * Soft deletes a user account.
   */
  abstract softDelete(id: string, tx?: DatabaseTx): Promise<void>;

  //Reads

  abstract findById<K extends keyof UserPersistence = keyof UserPersistence>(
    id: string,
    options?: UserPersistenceQueryOptions<K>,
  ): Promise<Pick<UserPersistence, K> | null>;
  abstract findByEmail<K extends keyof UserPersistence = keyof UserPersistence>(
    email: string,
    options?: UserPersistenceQueryOptions<K>,
  ): Promise<Pick<UserPersistence, K> | null>;
  abstract findByPhone<K extends keyof UserPersistence = keyof UserPersistence>(
    phone: string,
    options?: UserPersistenceQueryOptions<K>,
  ): Promise<Pick<UserPersistence, K> | null>;
}

export const USER_REPOSITORY_TOKEN = Symbol('USER_REPOSITORY_TOKEN');
export const PRISMA_USER_REPOSITORY_TOKEN = Symbol('PRISMA_USER_REPOSITORY_TOKEN');
