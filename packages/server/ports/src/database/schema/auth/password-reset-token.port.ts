import { DatabaseTx } from '../shared';
import {
  PasswordResetTokenPersistence,
  CreatePasswordResetTokenInput,
  PasswordResetTokenPersistenceQueryOptions,
} from './auth.types';

export abstract class PasswordResetTokenRepositoryPort {
  abstract create(
    data: CreatePasswordResetTokenInput,
    tx?: DatabaseTx,
  ): Promise<PasswordResetTokenPersistence>;

  /**
   * Marks a token as used, preventing replay attacks.
   */
  abstract markAsUsed(id: string, tx?: DatabaseTx): Promise<void>;

  /**
   * Invalidates all existing pending reset tokens for a user (e.g. when a new one is requested).
   */
  abstract invalidateAllForUser(userId: string, tx?: DatabaseTx): Promise<void>;

  abstract findByTokenHash<K extends keyof PasswordResetTokenPersistence>(
    tokenHash: string,
    options?: PasswordResetTokenPersistenceQueryOptions<K>,
  ): Promise<Pick<PasswordResetTokenPersistence, K> | null>;
}

export const PASSWORD_RESET_TOKEN_REPOSITORY_TOKEN = Symbol(
  'PASSWORD_RESET_TOKEN_REPOSITORY_TOKEN',
);
export const PRISMA_PASSWORD_RESET_TOKEN_REPOSITORY_TOKEN = Symbol(
  'PRISMA_PASSWORD_RESET_TOKEN_REPOSITORY_TOKEN',
);
