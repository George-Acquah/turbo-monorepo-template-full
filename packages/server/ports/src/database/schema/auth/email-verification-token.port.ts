import { DatabaseTx } from '../shared';
import {
  EmailVerificationTokenPersistence,
  CreateEmailVerificationTokenInput,
  EmailVerificationTokenPersistenceQueryOptions,
} from './auth.types';

export abstract class EmailVerificationTokenRepositoryPort {
  abstract create(
    data: CreateEmailVerificationTokenInput,
    tx?: DatabaseTx,
  ): Promise<EmailVerificationTokenPersistence>;

  abstract markAsUsed(id: string, tx?: DatabaseTx): Promise<void>;

  abstract invalidateAllForUser(userId: string, tx?: DatabaseTx): Promise<void>;

  //Reads
  abstract findByTokenHash<
    K extends keyof EmailVerificationTokenPersistence = keyof EmailVerificationTokenPersistence,
  >(
    tokenHash: string,
    options?: EmailVerificationTokenPersistenceQueryOptions<K>,
  ): Promise<Pick<EmailVerificationTokenPersistence, K> | null>;
}

export const EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN = Symbol(
  'EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN',
);
export const PRISMA_EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN = Symbol(
  'PRISMA_EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN',
);
