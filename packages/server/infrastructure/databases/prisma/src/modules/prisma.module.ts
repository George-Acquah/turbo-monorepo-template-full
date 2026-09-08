import { Global, Module, OnModuleInit } from '@nestjs/common';
import { TRANSACTION_PORT_TOKEN, PRISMA_TRANSACTION_PORT_TOKEN } from '@workspace/ports';
import { DatabaseCoreModule, DatabaseHealthService } from '@workspace/databases-core';
import { PrismaService } from '../client/prisma.client';
import { PRISMA_CLIENT_TOKEN } from '../client/prisma.tokens';
import { PrismaTransactionAdapter } from '../providers/prisma.provider';

/**
 * Owns the single Prisma client + its TransactionPort binding. No
 * repositories — persistence packages (@workspace/auth-persistence, etc.)
 * import this module and inject PrismaService via PRISMA_CLIENT_TOKEN.
 */
@Global()
@Module({
  imports: [DatabaseCoreModule],
  providers: [
    PrismaService,
    { provide: PRISMA_CLIENT_TOKEN, useExisting: PrismaService },
    PrismaTransactionAdapter,
    { provide: PRISMA_TRANSACTION_PORT_TOKEN, useExisting: PrismaTransactionAdapter },
    { provide: TRANSACTION_PORT_TOKEN, useExisting: PrismaTransactionAdapter },
  ],
  exports: [
    PrismaService,
    PRISMA_CLIENT_TOKEN,
    PrismaTransactionAdapter,
    PRISMA_TRANSACTION_PORT_TOKEN,
    TRANSACTION_PORT_TOKEN,
  ],
})
export class PrismaModule implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly health: DatabaseHealthService,
  ) {}

  onModuleInit(): void {
    this.health.register(this.prisma);
  }
}
