import { Global, Module } from '@nestjs/common';
import { AUDIT_COMMAND_PORT, AUDIT_QUERY_PORT } from '@repo/ports';
import { PrismaAuditStoreAdapter } from '../adapters/audit/prisma-audit-store.adapter';

@Global()
@Module({
  providers: [
    PrismaAuditStoreAdapter,
    { provide: AUDIT_COMMAND_PORT, useExisting: PrismaAuditStoreAdapter },
    { provide: AUDIT_QUERY_PORT, useExisting: PrismaAuditStoreAdapter },
  ],
  exports: [AUDIT_COMMAND_PORT, AUDIT_QUERY_PORT],
})
export class PrismaAuditStoreModule {}
