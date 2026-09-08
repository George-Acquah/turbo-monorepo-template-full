import { DatabaseTx } from '../shared';
import {
  UserPreferencePersistence,
  CreateUserPreferenceInput,
  UpdateUserPreferenceInput,
} from './auth.types';

export abstract class UserPreferenceRepositoryPort {
  abstract create(
    data: CreateUserPreferenceInput,
    tx?: DatabaseTx,
  ): Promise<UserPreferencePersistence>;

  abstract findByUserId(userId: string, tx?: DatabaseTx): Promise<UserPreferencePersistence | null>;

  abstract updateByUserId(
    userId: string,
    data: UpdateUserPreferenceInput,
    tx?: DatabaseTx,
  ): Promise<UserPreferencePersistence>;

  /**
   * Create-or-update. A row is normally created alongside the User, but that guarantee doesn't
   * hold for users created before that path existed — self-service saves must not 404 for them.
   */
  abstract upsertByUserId(
    userId: string,
    data: UpdateUserPreferenceInput,
    tx?: DatabaseTx,
  ): Promise<UserPreferencePersistence>;
}

export const USER_PREFERENCE_REPOSITORY_TOKEN = Symbol('USER_PREFERENCE_REPOSITORY_TOKEN');
export const PRISMA_USER_PREFERENCE_REPOSITORY_TOKEN = Symbol(
  'PRISMA_USER_PREFERENCE_REPOSITORY_TOKEN',
);
