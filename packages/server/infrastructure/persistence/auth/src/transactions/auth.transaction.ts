import { Inject, Injectable } from '@nestjs/common';
import { TransactionRunner, TRANSACTION_RUNNER_TOKEN } from '@workspace/databases-core';
import type { DatabaseTx, CreateUserInput, CreateUserPreferenceInput, UserPersistence } from '@workspace/ports';
import { PrismaUserAdapter } from '../adapters/prisma-user.adapter';
import { PrismaUserPreferenceAdapter } from '../adapters/prisma-user-preference.adapter';
import { DEFAULT_USER_PREFERENCES } from '../constants/auth-persistence.constants';

/**
 * Auth-specific unit-of-work helpers built on database-core's
 * TransactionRunner. Individual adapter methods already accept an explicit
 * `tx` per their port signature — this is for flows that span more than one
 * adapter and need atomicity.
 */
@Injectable()
export class AuthTransactions {
  constructor(
    @Inject(TRANSACTION_RUNNER_TOKEN) private readonly transactionRunner: TransactionRunner,
    private readonly userAdapter: PrismaUserAdapter,
    private readonly preferenceAdapter: PrismaUserPreferenceAdapter,
  ) {}

  /**
   * Creates a user and its default preferences row atomically.
   */
  withUserCreation(
    userInput: CreateUserInput,
    preferenceOverrides?: Partial<Omit<CreateUserPreferenceInput, 'userId'>>,
  ): Promise<UserPersistence> {
    return this.transactionRunner.run('prisma', async (tx: DatabaseTx) => {
      const user = await this.userAdapter.create(userInput, tx);
      await this.preferenceAdapter.create(
        { userId: user.id, ...DEFAULT_USER_PREFERENCES, ...preferenceOverrides },
        tx,
      );
      return user;
    });
  }
}
