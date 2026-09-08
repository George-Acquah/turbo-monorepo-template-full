import { Global, Module } from '@nestjs/common';
import { DATABASE_HEALTH_TOKEN } from '@workspace/ports';
import { DatabaseHealthService } from './health/database-health.service';
import { TransactionRunner } from './transactions/transaction-runner';
import { TRANSACTION_RUNNER_TOKEN } from './constants/database.tokens';

/**
 * Database-agnostic shared infrastructure: the TransactionRunner unit-of-work
 * helper and the DatabaseHealthService aggregator. This module does NOT bind
 * TransactionPort or ContextPort — those come from @workspace/prisma (or
 * @workspace/mongo) and @workspace/context respectively; the composing app
 * imports those alongside this module.
 */
@Global()
@Module({
  providers: [
    DatabaseHealthService,
    { provide: DATABASE_HEALTH_TOKEN, useExisting: DatabaseHealthService },
    TransactionRunner,
    { provide: TRANSACTION_RUNNER_TOKEN, useExisting: TransactionRunner },
  ],
  exports: [DATABASE_HEALTH_TOKEN, DatabaseHealthService, TRANSACTION_RUNNER_TOKEN, TransactionRunner],
})
export class DatabaseCoreModule {}
